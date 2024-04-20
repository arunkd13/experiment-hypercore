// See https://arunkd13.github.io/blog/datastructures-on-hypercore-queue/

const Hypercore = require('hypercore')
const readline = require('readline')

const core = new Hypercore('./hypercore/queue-1', options = {
    valueEncoding: 'json'
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

async function last() {
    if (core.length > 0) {
        return { index: core.length - 1, value: await core.get(core.length - 1) };
    } else {
        return null;
    }
}

async function dequeue() {
    var t = await last();
    if (t != null) {
        if (t.value.head >= 0) {
            const head = await core.get(t.value.head);
            // Check if next item is value block. If not keep looking for it.
            var next = t.value.head + 1;
            while (next < core.length) {
                var block = await core.get(next);
                if ('value' in block) {
                    break;
                }
                next++;
            }
            // write new head
            await core.append({
                head: (next < core.length) ? next : -1
            })
            console.log(head.value)
        } else {
            console.log('<empty>');
        }

    } else {
        console.log('<empty>')
    }
}

async function enqueue(value) {
    const t = await last();
    var head = -1;
    if (t != null) {
        head = t.value.head;
    }

    await core.append({ head: (head < 0) ? core.length : head, value });
}

async function queueToString() {
    var s= ''
    for (i = 0; i < core.length; i++) {
        s+= i + ': ' + JSON.stringify(await core.get(i)) + '\n'
    }

    return s
}

async function ask() {
    rl.question(await queueToString() + "> ", async (answer) => {
        switch (answer) {
            case 'dequeue': await dequeue(); break;
            default: await enqueue(answer); break;
        }

       ask()
    })
}

(async () => {
    await core.ready()
    await ask()
})();
