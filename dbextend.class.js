const { DatabaseClass } = require("@bot-whatsapp/database/mongo");

class dbExtend extends DatabaseClass {
    // constructor(_credentials) {
    //     super(_credentials);
    // }

    // listHistory = []

    // getPrevByNumber = async (from) => {
    //     const result = await this.db.collection('history').find({ from }).sort({ _id: -1 }).limit(1).toArray();
    //     return result[0]
    // }

    // save = async (ctx) => {
    //     await this.db.collection('test').insert(ctx);
    //     this.listHistory.push(ctx);
    // }
    
    async saveToCollection(collectionName, data) {
        await this.db.collection(collectionName).insert(data);
        this.listHistory.push(data);
      }

}

var mongo = dbExtend;

module.exports = mongo;