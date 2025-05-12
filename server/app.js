const express = require('express')

const Ajv = require('ajv')

const ajv = new Ajv()

const iban = require('iban')

const crypto = require("crypto")

const client = require("./data/databaseTestUsers")

const app = express();
app.use(express.json())

const port = 8000;

const bp = require('body-parser')

app.use(bp.json())

const cors = require("cors");
const { ucs2 } = require('punycode')
app.use(cors());

const bcrypt = require('bcrypt')

function generateRandom16DigitNumber() {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const remainingDigits = Math.floor(Math.random() * 1e15).toString().padStart(15, '0');
    return parseInt(`${firstDigit}${remainingDigits}`, 10);
}

function generateCVV3() {
    return Math.floor(Math.random() * 900) + 100; // 100-999
}

let ucty = null
let pouzivatelia = null
let pokus = 0
let prihlaseny = null
let nachadza = false
let transakcie = []
let karty = null

function generateRandomSlovakIban() {
    const bankCode = '0200';
    const accountNumber = Math.floor(Math.random() * 1e16).toString().padStart(16, '0');
    const bban = bankCode + accountNumber;
    return iban.fromBBAN('SK', bban);
}



client.query("SELECT * FROM inter_banking.pouzivatelia")
.then((result) => {
    ucty = result.rows
}).catch((err) => {
    console.log(err)
})



app.get('/', (req,res) => {
    res.send('serus');
});

app.get('/ucty',(req,res)=>{
    client.query("SELECT * FROM inter_banking.pouzivatelia")
    .then((result) => {
        ucty = result.rows
    }).catch((err) => {
        console.log(err)
    })
    res.json(ucty);
});

app.get('/prihlaseny', (req,res) => {
    res.json(prihlaseny)
})

app.get('/pokus', (req,res)=>{
    res.json(pokus)
})

app.post('/create', async (req,res) =>{
    const scheme = {
        type: 'object',
        properties: {
            first_name: {type: 'string'},
            last_name: {type: 'string'},
            email: {type: 'string'},
            phone: {type: 'string'},
            hashed_password: {type: 'string'},
            typUctu: {type: 'string'}
        },
        required: ['first_name','last_name','email', 'phone', 'hashed_password','typUctu'],
        additionalProperties: false
    }

    const validate = ajv.compile(scheme)
    const data = req.body
    const valid = validate(data)
    ucty.map((ucet) => {
        if (ucet.email === data.email) {
            nachadza = true
        }else if(ucet.phone === ucet.phone){
            nachadza = true
        }
    })
    data.user_id = crypto.randomBytes(6).toString('hex')
    try {
        const hash = await bcrypt.hash(data.hashed_password,10)
        data.hashed_password = hash

        if (!valid) {
            console.log(validate.errors)
        }  else {
            const iban = generateRandomSlovakIban()
            await client.query('INSERT INTO inter_banking.pouzivatelia(user_id,first_name,last_name,email,phone,hashed_pass,typUctu) VALUES ($1,$2,$3,$4,$5,$6,$7)',[data.user_id,data.first_name,data.last_name,data.email,data.phone,data.hashed_password,data.typUctu]) 
            await client.query('insert into inter_banking.ucty(user_id, account_number, account_type, balance, currency) values ($1,$2,$3,$4,$5)',[data.user_id,iban,data.typUctu,0,"EUR"])
            await client.query("SELECt account_id from inter_banking.ucty where user_id = $1",[data.user_id])
            .then(async (result) => {
                const ucet = result.rows    
                await client.query("insert into inter_banking.karty(acc_id, card_number, expiration_date, cvv) values ($1,$2,CURRENT_TIMESTAMP + INTERVAL '5 years',$3)",[ucet[0].account_id,generateRandom16DigitNumber(),generateCVV3()])
            })
            res.json({success:true})
        }
    } catch (error) {
        console.log(error)
    }
    
});

app.post('/zmenaEmailu', async (req,res) => {
    const data = req.body
    await client.query('update inter_banking.pouzivatelia set email = $1 where user_id = $2',[data.email,prihlaseny])
    .catch((err) => {
        console.log(err)
    })
    res.json("vydalo")
})

app.post('/deleteUcet', async (req,res) => {
    const data = req.body
    console.log(data)
    await client.query("SELECT account_id FROM inter_banking.ucty where account_number = $1",[data.account_number])
    .then(async (result) => {
        const ucet = result.rows
        await client.query('delete from inter_banking.transkcie where prijma_id = $1 or posiela_id = $1',[ucet[0].account_id])
        await client.query('delete from inter_banking.karty where acc_id = $1',[ucet[0].account_id])
    }).catch((err) => {
        console.log(err)
    })
    await client.query('delete from inter_banking.ucty where account_number = $1',[data.account_number])
    res.json("vydalo")
})



app.post('/createUcet', async (req,res) => {
    const data = req.body
    const iban = generateRandomSlovakIban()
    await client.query('insert into inter_banking.ucty(user_id, account_number, account_type, balance, currency) values ($1,$2,$3,$4,$5)',[pouzivatelia[0].user_id,iban,data.typ,0,"EUR"])
    await client.query("SELECT account_id from inter_banking.ucty where account_number = $1",[iban])
    .then(async (result) => {
        const ucet_id = result.rows
        await client.query("insert into inter_banking.karty(acc_id, card_number, expiration_date, cvv) values ($1,$2,CURRENT_TIMESTAMP + INTERVAL '5 years',$3)",[ucet_id[0].account_id,generateRandom16DigitNumber(),generateCVV3()])
    })
    res.json("vydalo")
})  

app.get('/pouzivatelia', (req,res) => {
    if (prihlaseny !== null) {
    client.query("SELECT * FROM inter_banking.ucty where user_id = $1",[prihlaseny])
    .then((result) => {
        pouzivatelia = result.rows
    }).catch((err) => {
        console.log(err)
    })
    }
    res.json(pouzivatelia);
})


app.get('/nachadza', (req,res) => {
    res.json(nachadza)
})

app.get('/nenachadza', (req,res) => {
    nachadza = false
})

app.get("/clearPokus", (req,res) => {
    pokus = 0
    res.json("serus")   
})

app.post('/login', async (req,res) => { 
    const data = req.body
    const pouzivate = ucty.find((pouzivatel) => pouzivatel.email === data.email)
    if (pouzivate !== undefined) {
        const skus = req.body.password
        const heslo = pouzivate.hashed_pass
        const jak = [pouzivate.user_id]
        const result = await bcrypt.compare(skus,heslo)
        jak.push(result)
        res.json(jak)
        if (result === true){
            prihlaseny = jak[0]
            pokus = 0
        }else{
            pokus += 1
        }
    }else{
        pokus += 1
    }
    
})

app.get("/transakcie", async (req, res) => {
    if (prihlaseny !== null) {
        await client.query("SELECT * FROM inter_banking.transkcie where prijma_id = $1 or posiela_id = $1",['100'])
        .then((result) => {
            transakcie = result.rows
        }).catch((err) => {
            console.log(err)
        })
    }
    res.json(transakcie)
})

app.get("/logOut", (req,res) => {
    prihlaseny = null
    pokus = 0
    res.json("odhlaseny")
})

app.get("/getKarty", async (req,res) => {
    if (pouzivatelia !== null) { 
        await client.query("SELECT * FROM inter_banking.karty where acc_id = $1",[pouzivatelia[0].account_id])
        .then((result) => {
            karty = result.rows
        }).catch((err) => {
            console.log(err)
        })
    }
    res.json(karty)
})

app.delete("/deleteAcc", async (req, res) => {
    const data = req.body
    pokus = 0
    prihlaseny = null
    nachadza = false
    await client.query('update inter_banking.transkcie set prijma_id = null where prijma_id = $1',[pouzivatelia[0].account_id])
    await client.query('update inter_banking.transkcie set posiela_id = null where posiela_id = $1',[pouzivatelia[0].account_id])
    await client.query('delete from inter_banking.karty where acc_id = $1',[pouzivatelia[0].account_id])
    await client.query('delete from inter_banking.ucty where user_id = $1',[data.id])
    await client.query('delete from inter_banking.pouzivatelia where user_id = $1',[data.id])    
    res.json("vydalo")
} )

app.listen(port, () => {
    console.log("live on http://localhost:${port}");
});