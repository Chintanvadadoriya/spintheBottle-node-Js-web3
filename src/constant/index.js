
exports.ETHERUM_RPC = 'https://ethereum.publicnode.com'

exports.ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

// Test net CONTRACT_ADDRESS ,DEPLOYED_BLOCK_NO,RPC_URL

// exports.CONTRACT_ADDRESS = "0x0a0639712552cE7eB575D91417DC1af079ECC21b";
// exports.DEPLOYED_BLOCK_NO = 7814531;
// exports.RPC_URL = 'https://polygon-amoy.infura.io/v3/942828c427e3456ea705fa67ddd2cb64';
// exports.RPC_URL_PUB = 'https://rpc-amoy.polygon.technology/';



// Main net  CONTRACT_ADDRESS ,DEPLOYED_BLOCK_NO,RPC_URL

exports.CONTRACT_ADDRESS = "0xc2F16E7c4E9b527b01C4B45Bd681BbE6e048E9D7";
exports.DEPLOYED_BLOCK_NO = 57784106;
exports.RPC_URL = 'https://polygon-mainnet.infura.io/v3/ffbb40268e5844daa68294acb9643d37';
//exports.RPC_URL = 'https://polygon-rpc.com';
exports.RPC_URL_PUB = 'https://polygon-rpc.com';


const AVATAR = [
    'Buster',
    'Smokey',
    'Dusty',
    'Gracie',
    'Misty',
    'Snuggles',
    'Gizmo',
    'Snickers',
    'Mimi',
    'Angel',
    'Bear',
    'Charlie',
    'Spooky',
    'Mia',
    'Pepper',
    'Snowball',
    'Oscar',
    'Cookie',
    'Sasha',
    'Jasper',
    'Felix',
    'Aneka'
];

exports.getRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * AVATAR.length);
    return AVATAR[randomIndex];
}


exports.MAIL_HOST = 'smtp.gmail.com'
exports.MAIL_PORT = 587

exports.MAIL_USER = 'chintan1612199@gmail.com'
exports.MAIL_PASS = 'uuea awuy cvco elef'
// exports.MAIL_USER='crudemailtest@gmail.com'
// exports.MAIL_PASS='gzzjecklbpdeljmw'
exports.TO = 'dean@spinthebottle.ai'