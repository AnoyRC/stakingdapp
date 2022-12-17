const {Connection, clusterApiUrl, Keypair, LAMPORTS_PER_SOL, StakeProgram, Authorized, Lockup, sendAndConfirmTransaction, PublicKey} = require("@solana/web3.js")

const main = async () => {
    const connection = new Connection(clusterApiUrl('devnet'), 'processed')
    const wallet = Keypair.generate()
    const airdropSignature = await connection.requestAirdrop(wallet.publicKey, 1* LAMPORTS_PER_SOL);
    const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: airdropSignature
        });
    
    const stakeAccount = Keypair.generate()
    const miniumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram)
    const ammountUserWantsToStake = 0.5 * LAMPORTS_PER_SOL
    const amountToStake = miniumRent + ammountUserWantsToStake

    const createStakeAccountTx = StakeProgram.createAccount({
        authorized: new Authorized(wallet.publicKey, wallet.publicKey),
        fromPubkey: wallet.publicKey,
        lamports: amountToStake,
        lockup: new Lockup(0,0, wallet.publicKey),
        stakePubkey:stakeAccount.publicKey
    })
    const createStakeAccountTxId = await sendAndConfirmTransaction(connection, createStakeAccountTx, [wallet,stakeAccount]) ;
    console.log(`Stake acount created, Tx Id: ${createStakeAccountTxId}`)
    let stakeBalance = connection.getBalance(stakeAccount.publicKey)
    console.log(`Stake Account Balance : ${stakeBalance / LAMPORTS_PER_SOL} SOLS`)

    let stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey)
    console.log(`Stake Account Status : ${stakeStatus.state}`)

    const validators = await connection.getVoteAccounts();
    const selectedValidator = validators.current[0]
    const selectedValidatorPubkey = new PublicKey(selectedValidator.votePubkey)
    const deligateTx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: wallet.publicKey,
        votePubkey : selectedValidatorPubkey
    })

    const deligateTxId = await sendAndConfirmTransaction(connection,deligateTx,[wallet])
    console.log(`Stake account delegated to ${selectedValidatorPubkey}, Tx Id: ${deligateTxId}`)
    console.log(`Stake Account Status : ${stakeStatus.state}`)
}

const runMain = async() => {
    try {
        await main()
    } catch (error) {
        console.log(error)
    }
}

runMain();