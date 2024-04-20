// See https://arunkd13.github.io/blog/datastructures-on-hypercore-queue/

const Hypercore = require('hypercore')
const readline = require('readline')

const valueCore = new Hypercore('./hypercore/queue-2/value', options = {
    valueEncoding: 'json'
})

const headCore = new Hypercore('./hypercore/queue-2/head', options = {
    valueEncoding: 'json'
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

async function headIndex() {
    if (headCore.length <= 0) {
        if (valueCore.length > 0) {
            return 0;
        } else {
            return -1;
        }
    } else {
        return await headCore.get(headCore.length - 1);
    }
}

async function dequeue() {
    var i = await headIndex();
    if (i >= 0) {
        const head = await valueCore.get(i);
        var next = i + 1;
        if (next >= valueCore.length) {
            next = -1;
        }
        // write new head
        await headCore.append(next);
        console.log(head)
    } else {
        console.log('<empty>')
    }
}

async function enqueue(value) {
    await valueCore.append(value);
}

async function coreToString(core) {
    var s = '';
    for (i = 0; i < core.length; i++) {
        s += i + ': ' + JSON.stringify(await core.get(i)) + '\n'
    }

    return s;
}

async function queueToString() {
    return 'values\n' + await coreToString(valueCore) + '\nhead\n' + await coreToString(headCore)
}

async function ask() {
    rl.question((await queueToString()) + "> ", async (answer) => {
        switch (answer) {
            case 'dequeue': await dequeue(); break;
            default: await enqueue(answer); break;
        }

       ask()
    })
}

(async () => {
    await valueCore.ready()
    await headCore.ready()
    await ask()
})();
