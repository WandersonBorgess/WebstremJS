import { createServer } from 'node:http'
import {  createReadStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { WritableStream, TransformStream } from 'node:stream/web'
import { setTimeout } from 'node:timers/promises'
import csvtojson from 'csvtojson'

const PORT = 3030
//curl -i -X OPTIONS -N localhost:3030
//curl -N localhost:3030
createServer(async (request, response) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
    }
    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers)
        response.end()
        return;
    }
    request.once('close', _=> console.log('connection was closed!', items))
    let items = 0
    Readable.toWeb(createReadStream('./animeflv.csv'))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(new TransformStream({
        transform(chunk, controller) {
            const data = JSON.parse(Buffer.from(chunk))
            const mappedData = {
                title: data.title,
                description: data.description,
                url_anime: data.url_anime
            }
            controller.enqueue(JSON.stringify(mappedData).concat('\n'))
        }
    }))
    .pipeTo(new WritableStream({
        async write(chunk) {
            await setTimeout(1000)
            items ++
            response.write(chunk)
        },
        close() {
            response.end()
        }
    }))

    response.writeHead(200, headers)
    // response.end('ok')
})
.listen(PORT)
.on('listening', _=> console.log(`server is running at ${PORT}`))