// See https://arunkd13.github.io/blog/datastructures-on-hypercore-stack/

const Hypercore = require('hypercore')
const readline = require('readline')

const core = new Hypercore('./hypercore/stack', options = {
    valueEncoding: 'json'
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

async function top() {
    var top = core.length - 1
    if (top < 0) {
        return null
    }

    var block = await core.get(top)
    if ('top' in block) {
        top = block.top
        if (top < 0) {
            return null
        }
        block = await core.get(top)
    }

    return { index: top, value: block.value }
}

async function pop() {
    var t = await top()
    if (t != null) {
        console.log(t.value)

        // check if prev item is a pointer and if so write its value
        var prev = t.index - 1
        if (prev >= 0) {
            var block = await core.get(prev)
            if ('top' in block) {
                prev = block.top
            }
        }
        // write new top
        await core.append({
            top: prev 
        })
    } else {
        console.log('<empty>')
    }
}

async function push(value) {
    await core.append({
        value: value
    })
}

async function stackToString() {
    var stack = ''
    for (i = 0; i < core.length; i++) {
        stack += i + ': ' + JSON.stringify(await core.get(i)) + '\n'
    }

    return stack
}

async function ask() {
    rl.question(await stackToString() + "> ", async (answer) => {
        switch (answer) {
            case 'top': {
                var t = await top();
                if (t != null) {
                    console.log(t.value)
                } else {
                    console.log('<empty>')
                }
                break;
            }
            case 'pop': await pop(); break;
            default: await push(answer); break;
        }

       ask()
    })
}

(async () => {
    await core.ready()
    await ask()
})();