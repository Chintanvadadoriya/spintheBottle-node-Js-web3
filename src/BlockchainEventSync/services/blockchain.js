const { ethers } = require("ethers");
const { EVENTS_TYPE } = require("../eventTypes");
const { contract } = require("./provider");
const { hashCreate, newRoundAction, winnerSelectedAction, enteredAction } = require("./eventActions");


const listenToEvents = async () => {
    try {
        contract.on(EVENTS_TYPE.NEWROUND, async (round, prize, start, isBonus, event) => {

            await Promise.all([
                // hashCreate(event),
                newRoundAction({
                    round: Number(round),
                    prize: Number(prize),
                    start: Number(start),
                    isBonus,
                    transactionHash: event?.transactionHash,
                    logIndex: event?.logIndex
                })

            ])
            const eventData = {
                round: Number(round),
                prize: Number(prize),
                start: Number(start),
                isBonus,
                transactionHash: event?.transactionHash,
                logIndex: event?.logIndex

            }
            // await channel.sendToQueue('eventQueue', Buffer.from(JSON.stringify(eventData)), { persistent: true });
            console.log('Event pushed to queue:', eventData);
        });

        contract.on(EVENTS_TYPE.WINNERSELECTED, async (round, user, prize, event) => {

            await Promise.all([
                // hashCreate(event),
                winnerSelectedAction({
                    round: Number(round),
                    user: user?.toLowerCase(),
                    prize: ethers.utils.formatEther(prize),
                    transactionHash: event?.transactionHash,
                    event:event
                    
                })
            ]);
            const eventData = {
                type: EVENTS_TYPE.WINNERSELECTED,
                payload: {
                    round: Number(round),
                    user: user?.toLowerCase(),
                    prize: ethers.utils.formatEther(prize),
                    transactionHash: event?.transactionHash,
                    logIndex: event?.logIndex
                }
            }
            console.log('Event pushed to queue:', eventData);

            // await channel.sendToQueue('eventQueue', Buffer.from(JSON.stringify(eventData)), { persistent: true })
        })

        contract.on(EVENTS_TYPE.ENTERED, async (round, user, amount, event) => {

            await Promise.all([
                // hashCreate(event),
                enteredAction({
                    round: Number(round),
                    user: user?.toLowerCase(),
                    amount: ethers.utils.formatEther(amount),
                    transactionHash: event?.transactionHash,
                    logIndex: event?.logIndex
                })
            ])
            const eventData = {
                type: EVENTS_TYPE.ENTERED,
                payload: {
                    round: Number(round),
                    user: user?.toLowerCase(),
                    amount: ethers.utils.formatEther(amount),
                    transactionHash: event?.transactionHash,
                    logIndex: event?.logIndex
                }
            }
            console.log('Event pushed to queue:', eventData);
            // await channel.sendToQueue('eventQueue', Buffer.from(JSON.stringify(eventData)), { persistent: true })
        })
    } catch (err) {
        console.log('err', err)
    }
}



module.exports = listenToEvents;