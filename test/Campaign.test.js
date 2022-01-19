const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const compiledCampaignFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

// connect ganache test network provider
const web3 = new Web3(ganache.provider());

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
  // setup accounts
  accounts = await web3.eth.getAccounts();
  // deploy local factory instance
  factory = await new web3.eth.Contract(JSON.parse(compiledCampaignFactory.interface))
  .deploy({ data: compiledCampaignFactory.bytecode })
  .send({ from: accounts[0], gas: '3000000' })
  
  // use factory methods
  // create campaign 
  await factory.methods.createCampaign('100').send({
    from: accounts[0],
    gas: '3000000'
  })
  // get all existed campaigns list
  const campaigns = await factory.methods.getDeployedCampaigns().call();
  // choose one we wanna use
  campaignAddress = campaigns[0];

  // create an instance to a previously deployed contract by it's address
  campaign = await new web3.eth.Contract( JSON.parse(compiledCampaign.interface), campaignAddress );
});

describe('Campaigns', () => {
  // first common test is check if all contracts was deployed properly as expected
  it('deploys a factory and a campaign', () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  it('marks caller as the campaign manager', async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(manager, accounts[0]);
    console.log(campaign)
  })

  it('allows people to contribute to a contract, marks them as approvers', async () => {
    // call function to donate some money
    await campaign.methods.contribute().send({
      value: '200',
      from: accounts[1]
    });
    // check if we are contributors now
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  })

  it('requires a minimum amount contribution', async () => {
    try {
      await campaign.methods.contribute().send({
        value: '5',
        from: accounts[1]
      });
      // make sure that test fails if so
      assert(false)
    } catch (err) {
      assert(err)
    }
  })

  it('allows a manager to make a request', async () => {
    // create request
    await campaign.methods.createRequest('Buy supplies', 100000, accounts[1]).send({
      from: accounts[0]
    });
    // make sure our request now is stored inside the contract
    const requests = await campaign.methods.requests(0).call(); // we pass into array "requests" params like () because it creates get function actually for this array and we use it to get our arr

    assert.equal('Buy supplies', requests.description);
  })

  // end-to-end testing
  it('processes requests', async () => {
    // create a contract
    // check if a manager is a creator of the contract
    // try to contribute into a project
    // check if contributed account now exists inside contributors mapping
    // create a buying request
    // vote for a particular request, approve it
    // finalize request
    // check if the receiver actually get the money from the manager
  })
});


// HOW TO THINK ABOUT TEST (my thoughts)

// PREPARE 
// First we write down by comments all-all steps from every contract's start to the end
// we need to do to create our e2e test (to see all important functions in process)

// WRITE ACTUAL CODE
// We need to make sure our contracts are deployed properly. Usually it will be wrote inside beforeEach()
// 

// Check other functions that can be exists, but was not used when we were write our e2e test guide