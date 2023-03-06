require('dotenv').config()

const {
    createBot,
    createProvider,
    createFlow,
    addKeyword,
    CoreClass,
} = require("@bot-whatsapp/bot");


const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MongoAdapter = require('@bot-whatsapp/database/mongo');

const ChatGPTClass = require('./chatgpt3.class')

const createBotGPT = async ({ flow, provider, database }) => {
    return new ChatGPTClass(flow, database, provider);
};

// const dbExtendClass = require('./dbextend.class')
// // const dbquery = async ({database}) => {
// //     return new dbExtendClass(database)
// // }

// const adapterDB = new MongoAdapter({
//     dbUri: 'mongodb+srv://admin:1234@cluster0.3nutb.mongodb.net/<testDB>?retryWrites=true&w=majority',
//     dbName: 'db_bot',
// })
// const adapter = new dbExtendClass(adapterDB);








// const flowCredits = addKeyword(['credit'])
//     .addAnswer(
//         ['Hola!', 'Para tomar su solicitud necesitamos unos datos...', 'Escriba su *Nombre*'],
//         { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

//         async (ctx, { flowDynamic, endFlow }) => {
//             if (ctx.body == '❌ Cancelar solicitud')
//                 return endFlow({
//                     body: '❌ Su solicitud ha sido cancelada ❌',    // Aquí terminamos el flow si la condicion se comple
//                     buttons: [{ body: '⬅️ Volver al Inicio' }]                      // Y además, añadimos un botón por si necesitas derivarlo a otro flow


//                 })
//             nombre = ctx.body
//             return flowDynamic(`Encantado *${nombre}*, continuamos...`)
//         }
//     )


const flowPrecios = addKeyword(['Price', 'credit'])
    .addAnswer(
        [
            '👉 *$19.000 clp* https://mpago.la/1fQrScW',
            '👉 *$120 usd* 6 month https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-5GM09587UV317715DMP575TY',
            '👉 *1 year* $210 usd https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-4K92802885911200UMP576TY',
        ],
        { media: 'https://chatxbot.live/wp-content/uploads/2021/11/Image-7501.png', },
        null,
        []
    )



const flowGracias = addKeyword(['Thanks'])
    .addAnswer(
        [
            'Its a pleasure!.',
        ],
        null,
        [null]
    )



let nombre;
let cantpasajeros;
let diahora;
let origen;
let destino;

const flowNewBot = addKeyword(['bot'])
    .addAnswer(
        ['Hola!', 'Para tomar su solicitud necesitamos unos datos...', 'Escriba su *Nombre*'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',    // Aquí terminamos el flow si la condicion se comple
                    buttons: [{ body: '⬅️ Volver al Inicio' }]                      // Y además, añadimos un botón por si necesitas derivarlo a otro flow

                })
            nombre = ctx.body
            return flowDynamic(`Encantado *${nombre}*, continuamos...`)
        }
    )
    .addAnswer(
        ['¿Cuál es la dirección de origen? Si estás en el aeropuerto, indica puerta 1 o plataforma embarque.'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]
                })
            origen = ctx.body
            return flowDynamic(`Ok, te pasamos a buscar a *${origen}*...`)
        }
    )
    .addAnswer(
        ['¿Cuál es la dirección de destino?'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]
                })
            destino = ctx.body
            return flowDynamic(`Perfecto *${nombre}*...`)
        }
    )
    .addAnswer(
        ['¿Qué día y hora pasamos a buscarte?'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]
                })
            diahora = ctx.body
            return flowDynamic(`Entendido, *${nombre}*...`)
        }
    )
    .addAnswer(
        ['Por último, cuántos pasajeros viajan?'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
                return endFlow({
                    body: '❌ Su solicitud ha sido cancelada ❌',
                    buttons: [{ body: '⬅️ Volver al Inicio' }]
                })
            cantpasajeros = ctx.body
            const numeroAleatorio = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            return flowDynamic(`Tu pedido ya está ingresado *${nombre}*! el resumen de tu solicitud es:
                  \n N° Solicitud *${numeroAleatorio}*
                  \n- Nombre: *${nombre}*
                  \n- Origen: *${origen}*
                  \n- Destino: *${destino}*
                  \n- Día y hora: *${diahora}*
                  \n- N° Pasajeros: *${cantpasajeros}*
                  
                  \n\n El conductor asignado se comunicará directamente con ud para informar que está en camino hacia su domicilio.
                  \n Muchas gracias!`)
        }
    )



// const flowCash = addKeyword('cash').addAnswer('Traeme los billetes! 😎')

// const flowOnline = addKeyword('paypal')
//     .addAnswer('Voy generar un link de paypal *escribe algo*', { capture: true }, async (_, { flowDynamic }) => {
//         //   await fakeHTTP()
//         // payment()
//         await flowDynamic('Esperate.... estoy generando esto toma su tiempo')
//     })
//     .addAnswer('Aqui lo tienes 😎😎', null, async (_, { flowDynamic }) => {
//         //   await fakeHTTP()
//         await flowDynamic('http://paypal.com')
//     })
//     .addAnswer('Apurate!')


// const flujoPrincipal = addKeyword('hola')
//     //   .addAnswer('¿Como estas todo bien?')
//     //   .addAnswer('Espero que si')
//     .addAnswer('¿Cual es tu email?', { capture: true }, async (ctx, { fallBack }) => {
//         if (!ctx.body.includes('@')) {
//             return fallBack('Veo que no es um mail *bien*')
//         }
//     })
//     //   .addAnswer('Voy a validar tu email...', null, async (_, { flowDynamic }) => {
//     //     //   await fakeHTTP()
//     //       return flowDynamic('Email validado correctamten!')
//     //   })
//     .addAnswer('¿Como vas a pagar *paypal* o *cash*?', { capture: true }, async () => { }, [flowCash, flowOnline])


// const flowCredits = addKeyword('credit')
// .addAnswer('Créditos disponibles', { capture: true }, async (_, { flowDynamic }) => {
//     //   await fakeHTTP()
//     // await queryCredits()

//     await flowDynamic('Esperate.... estoy generando esto toma su tiempo')
// })
// .addAnswer('Aqui lo tienes 😎😎', null, async (_, { flowDynamic }) => {
//     //   await fakeHTTP()
//     await flowDynamic('http://paypal.com')
// })
// .addAnswer('Apurate!')


const flowPrincipal = addKeyword(['chapa'])
// const flowPrincipal = addKeyword(['hola', 'buenos dias', 'buenas tardes', 'buenas noches'])
    .addAnswer(
        [
            '🙌 Bienvenido a *Chatxbot*. \n',
            'Soy un Asistente Inteligente',
            '\nEscribe:\n',
            '👉 *bot*\nPara crear un nuevo asistente\n',
            '👉 *credit*\nPara consultar o comprar créditos',

        ],
        { media: 'https://chatxbot.live/wp-content/uploads/2021/11/human.svg', },
        null,
        []
    )
    .addAnswer('Voy a validar tu email...', null, async (_, { flowDynamic }) => {
        // await queryCredits()
        return flowDynamic('Email validado correctamten!')
    })


// const queryCredits = async () => {
//     console.log("queryCredits")
//     const ctxByNumber = {"number": true}
//     await this.databaseClass.saveCollection('mycollectionname',ctxByNumber)
    
//     // await adapter.saveToCollection('myCollection', ctxByNumber);
// }


 

const main = async () => {
    // const adapterDB = new MockAdapter()
    const adapterDB = new MongoAdapter({
        dbUri: 'mongodb+srv://admin:1234@cluster0.3nutb.mongodb.net/<testDB>?retryWrites=true&w=majority',
        dbName: 'db_bot',
    })
    const adapterProvider = createProvider(BaileysProvider)
    // const adapterFlow = createFlow([flowPrincipal, flowTaxi, flowGracias, flowPrecios])
    const adapterFlow = createFlow([flowPrincipal])
    createBotGPT({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB
    })

    // dbquery({
    //     database: adapterDB
    // })

    // QRPortalWeb()
    const BOTNAME = 'bot'
    QRPortalWeb({ name: BOTNAME, port: 3000 })
}

main()
