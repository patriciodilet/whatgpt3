const { CoreClass } = require("@bot-whatsapp/bot");

// const CustomMongoAdapter = require('./dbextend.class');


class ChatGPTClass extends CoreClass {
    queue = [];
    optionsGPT = { model: "text-davinci-003", temperature:0 };
    // openai = undefined;
    generalArgs = { blackList: [], listEvents: {} }

    database = null
    
    constructor(_flow,_database, _provider) {
        super(_flow, _database, _provider);
        this.optionsGPT = { ...this.optionsGPT };
        this.generalArgs = { ...this.generalArgs }
        // this.init().then();
        this.database = _database
    }

    // init = async () => {
    //     const { ChatGPTAPI } = await import('chatgpt')
    //     this.openai = new ChatGPTAPI({
    //         apiKey: process.env.OPENAI_API_KEY,
    //     });
    // };


    
    handleMsg = async (ctx) => {
        const { body, from } = ctx
        let msgToSend = []
        let endFlowFlag = false
        let fallBackFlag = false
        if (!body) return
        if (!body.length) return

        let prevMsg = await this.databaseClass.getPrevByNumber(from)
        const refToContinue = this.flowClass.findBySerialize(prevMsg?.refSerialize)

        






        const toCtx = ({ body, from, prevRef, options = {}, index }) => {
            // console.log("1");
            return {
                ref: null,
                keyword: prevRef,
                answer: body,
                options: options ?? {},
                from,
                refSerialize:{ index, answer: body }
                // refSerialize: generateRefSerialize({ index, answer: body }),
            }
        }

        if (prevMsg?.ref) {
            // console.log("2");
            const ctxByNumber = toCtx({
                body,
                from,
                prevRef: prevMsg.refSerialize,
            })
            await this.databaseClass.save(ctxByNumber)
        }


        // 📄 Crar CTX de mensaje (uso private)
        const createCtxMessage = (payload = {}, index = 0) => {
            const body = typeof payload === 'string' ? payload : payload?.body ?? payload?.answer
            const media = payload?.media ?? null
            const buttons = payload?.buttons ?? []
            const capture = payload?.capture ?? false
            console.log("3");
            return toCtx({
                body,
                from,
                keyword: null,
                index,
                options: { media, buttons, capture },
            })
        }

        // 📄 Finalizar flujo
        const endFlow =
        (flag) =>
        async (message = null) => {
            console.log("4");

            flag.endFlow = true
            endFlowFlag = true
            if (message) this.sendProviderAndSave(from, createCtxMessage(message))
            // clearQueue()
            return
        }

        // 📄 Esta funcion se encarga de enviar un array de mensajes dentro de este ctx
        const sendFlow = async (messageToSend, numberOrId, options = { prev: prevMsg }) => {
            if (options.prev?.options?.capture) await cbEveryCtx(options.prev?.ref)
            console.log("5");
            const queue = []
            for (const ctxMessage of messageToSend) {
                if (endFlowFlag) { 
                    console.log("5.1");
                    return 
                }
                console.log("5.2");

                const delayMs = ctxMessage?.options?.delay || 0
                if (delayMs) await delay(delayMs)
                // await QueuePrincipal.enqueue(() =>
                console.log(numberOrId)
                this.sendProviderAndSave(numberOrId, ctxMessage).then(() => resolveCbEveryCtx(ctxMessage))
                // )
            }
            return Promise.all(queue)
        }

        const continueFlow = async () => {
            const currentPrev = await this.databaseClass.getPrevByNumber(from)
            const nextFlow = (await this.flowClass.find(refToContinue?.ref, true)) ?? []
            const filterNextFlow = nextFlow.filter((msg) => msg.refSerialize !== currentPrev?.refSerialize)
            const isContinueFlow = filterNextFlow.map((i) => i.keyword).includes(currentPrev?.ref)
            // console.log("6");

            if (!isContinueFlow) {
                console.log("7");

                const refToContinueChild = this.flowClass.getRefToContinueChild(currentPrev?.keyword)
                const flowStandaloneChild = this.flowClass.getFlowsChild()
                const nextChildMessages =
                    (await this.flowClass.find(refToContinueChild?.ref, true, flowStandaloneChild)) || []
                if (nextChildMessages?.length) {
                        console.log("8");
                        return await sendFlow(nextChildMessages, from, { prev: undefined })
                    }
            }

            if (!isContinueFlow) {
                console.log("9");
                await sendFlow(filterNextFlow, from, { prev: undefined })
                return
            }
        }
        // 📄 [options: fallBack]: esta funcion se encarga de repetir el ultimo mensaje
        const fallBack =
            (flag) =>
            async (message = null) => {
                // console.log("10");
                
                QueuePrincipal.queue = []
                flag.fallBack = true
                await this.sendProviderAndSave(from, {
                    ...prevMsg,
                    answer: typeof message === 'string' ? message : message?.body ?? prevMsg.answer,
                    options: {
                        ...prevMsg.options,
                        buttons: prevMsg.options?.buttons,
                    },
                })
                return
            }

        // 📄 [options: flowDynamic]: esta funcion se encarga de responder un array de respuesta esta limitado a 5 mensajes
        // para evitar bloque de whatsapp

        const flowDynamic =
            (flag) =>
            async (listMsg = []) => {
                flag.flowDynamic = true
                if (!Array.isArray(listMsg)) listMsg = [listMsg]

                const parseListMsg = listMsg.map((opt, index) => createCtxMessage(opt, index))

                if (endFlowFlag) return
                for (const msg of parseListMsg) {
                    await this.sendProviderAndSave(from, msg)
                }
                await continueFlow()
                return
            }

        // 📄 Se encarga de revisar si el contexto del mensaje tiene callback o fallback
        const resolveCbEveryCtx = async (ctxMessage) => {
            if (!ctxMessage?.options?.capture) { 
                return await cbEveryCtx(ctxMessage?.ref)
            }
        }

        // 📄 Se encarga de revisar si el contexto del mensaje tiene callback y ejecutarlo
        const cbEveryCtx = async (inRef) => {
            let flags = {
                endFlow: false,
                fallBack: false,
                flowDynamic: false,
                wait: true,
            }

            const provider = this.providerClass

            if (!this.flowClass.allCallbacks[inRef]) {
                return Promise.resolve()
            } 

            const argsCb = {
                provider,
                fallBack: fallBack(flags),
                flowDynamic: flowDynamic(flags),
                endFlow: endFlow(flags),
            }

            await this.flowClass.allCallbacks[inRef](ctx, argsCb)
            const wait = !(!flags.endFlow && !flags.fallBack && !flags.flowDynamic)
            if (!wait) await continueFlow()

            return
        }

        async function askQuestion(body, from) {
            // const response = await fetch('http://127.0.0.1:5000/api/question', {
             const response = await fetch('https://apigpt3.onrender.com/api/question', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: body,
                phone_client: '56954641957',
                phone_customer: from,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              return data.ai_response;
            } else {
              return 'Te respondo en un momento, gracias!';
            }
          }

        // 📄🤘(tiene return) [options: nested(array)]: Si se tiene flujos hijos los implementa
        if (!endFlowFlag && prevMsg?.options?.nested?.length) {
            console.log("16");
            const nestedRef = prevMsg.options.nested
            const flowStandalone = nestedRef.map((f) => ({
                ...nestedRef.find((r) => r.refSerialize === f.refSerialize),
            }))

            msgToSend = this.flowClass.find(body, false, flowStandalone) || []
            if (msgToSend.length){
                // console.log("msgToSend.leng 16)");
                // console.log(msgToSend.length)
            } else {
                try {
                    // await this.databaseClass.saveCollection('test', from)

                    const aiResponse = await askQuestion(body, from);
                    console.log("aiResponse")
                    console.log(aiResponse)
                    const parseMessage = {answer: aiResponse };
                    this.sendFlowSimple([parseMessage], from);

                } catch (error) {
                    // console.error(error)
                    const parseMessage = {answer: 'Por favor pregunte nuevamente en un momento, tengo una sobrecarga de trabajo.' + error };
                    this.sendFlowSimple([parseMessage], from);
                }
            }
            await sendFlow(msgToSend, from)
            return
        }

        // 📄🤘(tiene return) Si el mensaje previo implementa capture
        if (!endFlowFlag && !prevMsg?.options?.nested?.length) {
            const typeCapture = typeof prevMsg?.options?.capture

            if (typeCapture === 'boolean' && fallBackFlag) {
                console.log("sendFlow 29")
                msgToSend = this.flowClass.find(refToContinue?.ref, true) || []
                await sendFlow(msgToSend, from)
                return
            }
        }

        msgToSend = this.flowClass.find(body) || []
        if (msgToSend.length) return sendFlow(msgToSend, from)

        if (!prevMsg?.options?.capture) {
            msgToSend = this.flowClass.find(this.generalArgs.listEvents.WELCOME) || []
            try {

            

                // const toCtx2 = {
                //     from
                // }

                // await this.databaseClass.saveCollection('test', toCtx2)
                // const adapter = new CustomMongoAdapter(database);

                // await adapter.saveToCollection('myCollection', toCtx2);

                // const urlRegex = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/;
                // if (urlRegex.test(body)) {
                //     console.log("dentro de url regex")
                //     msgToSend = this.flowClass.find(this.generalArgs.listEvents.VOICE_NOTE) || [];
                // }
                console.log("voy x askQuestion")

                const aiResponse = await askQuestion(body, from);            
                const parseMessage = {answer: aiResponse };
                // this.sendFlowSimple([parseMessage], from);
                console.log("aiResponse")
                console.log(aiResponse)
                const parseMessage2 = {answer: aiResponse ,
                    options: { media: aiResponse }
                    // options: { media: 'https://file-examples.com/storage/fe0b804ac5640668798b8d0/2017/11/file_example_MP3_700KB.mp3' }
                    // options: { media: 'http://localhost:3000/audio.mp3' }
                };
                this.sendProviderAndSave(from, parseMessage2)

            } catch (error) {
                const parseMessage = {answer: 'Please, ask again in a moment: ' + error };
                this.sendFlowSimple([parseMessage], from);
            }
        }

        return sendFlow(msgToSend, from)
 
    };
}

module.exports = ChatGPTClass;