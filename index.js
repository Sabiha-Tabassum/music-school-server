const express = require('express');
const app = express();
const cors = require('cors');


const jwt = require('jsonwebtoken');

require('dotenv').config()

const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



// verify jwt

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization)
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }

  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}




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
    const classCollection = client.db("musicDB").collection("class");
    const myClassCollection = client.db("musicDB").collection("myclass");
    const paymentCollection = client.db("musicDB").collection("payment");

    // const totalEnrollCollection = client.db("musicDB").collection("totalenroll");

    // post jwt token 

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({ token })
    })

    // verify admin

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      if (user?.role !== 'Admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }


    // get user

    app.get('/user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    // post user
    app.post('/user', async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      console.log('existing user', existingUser);
      if (existingUser) {
        return res.send({ message: 'user already exist' })
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // update user admin

    app.patch('/user/admin/:id', async (req, res) => {
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

    app.patch('/user/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Instructor'
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);


    })

    // get admin  email for UseAdmin

    app.get('/user/admin/:email', async (req, res) => {
      const email = req.params.email;



      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'Admin' }
      res.send(result);

    })


    // get instructor email for UseInstructor

    app.get('/user/instructor/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email)



      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === 'Instructor' }
      res.send(result);

    })


    // add class to DB

    app.post('/class', async (req, res) => {
      const newClass = req.body;
      const result = await classCollection.insertOne(newClass);
      res.send(result);
    })


    // get class by admin those are added by instructor

    app.get('/class', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    })


    // update class by admin (approve)

    app.patch('/class/approve/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Approved'
        },
      };

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);


    })

    // update class by admin (deny)

    app.patch('/class/deny/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Denied'
        },
      };

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);


    })

    // deny feedback update

    app.patch('/class/denyFeedback/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: 'This class is not opening yet'
        },
      };

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);


    })

    // approve feedback update

    app.patch('/class/approveFeedback/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: 'This class is going on successfully'
        },
      };

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);


    })


   // my class post

   app.post('/myclass', async (req, res) => {
    const myClass = req.body;

    console.log(myClass);


    const result = await myClassCollection.insertOne(myClass);
    res.send(result);
  })

   
  // get my class

  app.get('/myclass', async (req, res) => {
    const result = await myClassCollection.find().toArray();
    res.send(result);
  })

  // myclass delete 

  app.delete('/myclass/:id', async(req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id)}
    const result = await myClassCollection.deleteOne(query);
    res.send(result);
  })



  // get myclass data according to id

  app.get('/myclass/:id', async(req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id)}
    const result = await myClassCollection.findOne(query);
    res.send(result);
  })



   // create payment intent

   app.post('/create-payment-intent',  async(req, res) => {
    const {price} = req.body;
    const amount = price * 100;
    console.log(price, amount);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    });
    res.send({
      clientSecret: paymentIntent.client_secret
    })
  })



  // payment api 

  app.post('/payment', async(req, res) => {
    const payment = req.body;
    const insertResult = await paymentCollection.insertOne(payment);

    const query = {_id: {$in: payment.mySelectedClass.map(id => new ObjectId(id))}}
    const deleteResult = await myClassCollection.deleteMany(query);
    
    res.send({insertResult, deleteResult});
  })


  app.get('/payment', async (req, res) => {
    const result = await paymentCollection.find().toArray();

    res.send(result);
  })

  // total enroll post

  // app.post('/totalenroll', async (req, res) => {
  //   const totalEnroll = req.body;

  //   console.log(totalEnroll);


  //   const result = await totalEnrollCollection.insertOne(totalEnroll);
  //   res.send(result);
  // })
   




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