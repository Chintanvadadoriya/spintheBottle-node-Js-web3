const { MAILGUN_SENDER_EMAIL } = require("./src/constant");
const mg = require("./src/helper/mailgun");
// const mg = require("mailgun.js");

const { catchAsyncError } = require("./src/utils")

const DOMAIN="sandboxcbbdbbe1568f417ea960345abdb07de9.mailgun.org"

// const mailgun=()=>mg({
//   apikey:'6541c4c42e62aa25f77d698c24ba4ed4-a4da91cf-d8b0acc2',
//   domain:DOMAIN
// })

async function mailgunSend(){
  try{
    
    const messages= {
        from: 'chintanv@logisticinfotech.co.in',
        to: "chintan1612199@gmail.com",
        subject: "Hello",
        text: "Testing some Mailgun awesomness!",
      }

    // const data= await mg.messages.create(DOMAIN,messages)

    //   console.log('mailSend', data) 
    // const data = await mg.lists.members.createMember(
    //   'tesseractx@mail.tesseractx.com',
    //   {
    //     address: 'chintan1612199@gmail.com',
    //     name: "tesseractx",
    //     vars: { hobby: "crypto" },
    //     subscribed: "yes",
    //     upsert: "yes",
    //   }
    // );

    await mg.messages().send(messages,(err,body)=>{
      if(err){
        console.log("errrr",err)
      }else{
        console.log("success!!!!")
      }
    })
console.log('data', data)
}catch(error){
  console.log('send Mail', error)
  
}
}

mailgunSend()