const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()

require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udpn3wh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("musicDB").collection("user");
    
    // get user

    app.get('/user', async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    // post user
    app.post('/user', async(req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email}
      const existingUser = await userCollection.findOne(query);
      console.log('existing user', existingUser);
      if(existingUser){
        return res.send({message: 'user already exist'})
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // update user admin

    app.patch('/user/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Admin'
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);


  })

  // update user instructor
  app.patch('/user/instructor/:id', async(req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };})


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('music school is opening')
})


app.listen(port, () => {
    console.log(`music school is going on port ${port}`)
})