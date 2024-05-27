var socket = io();

    function getData(path)
    {
        return new Promise((resolve, reject) => {
            fetch(path)
            .then(response => response.json())
            .then(data => {
                resolve(data)
            })
            .catch(error => {
                console.log(error);
            })
        });
    }
    console.log("screen width " + screen.width);
    console.log("screen height " + screen.height);

    const VELOCITY_MAX = 5.0;
    const VELOCITY_MIN = 2.6;

    const degreeTable = await getData(jsonName);

    let probabilites = {}
    for (const [key, values] of Object.entries(degreeTable)) {
        console.log(degreeTable[key]['probability']);
        probabilites[key] = degreeTable[key]['probability'];
        
    }

    let totalProbability = Object.values(probabilites).reduce((acc, curr) => {return acc + curr}, 0);
    if (totalProbability != 1)
        throw new Error('probabilites don`t addup');
    //const probabilites = await getData('probabilityTable.json');

    let popup = document.getElementById('popup');

    let rad = document.getElementById('glücksrad');

    let winningItem = "";

    document.getElementById('acceptButton').addEventListener('click', removePopup);
    document.getElementById('declineButton').addEventListener('click', () => {
        increaseItemAgain();
        removePopup();
    });

    rad.addEventListener('click', async () => {
        initiateItemAlgorithm();
    });

    async function initiateItemAlgorithm()
    {
        try {
            if (rotating)
                return;

            console.log('rotating');
            rotating = true;
            winningItem = await calculateWinningItem();
            
            socket.emit('decreaseItemCount', winningItem);
            console.log('winning item: ' + winningItem);
            let itemArea = degreeTable[winningItem]['degrees'];
            let from = itemArea[0] + 5;
            let to = itemArea[1] - 5;
            let destinationDegrees = Math.random() * (to - from) + from;
            const arrowPosition = ((360 - destinationDegrees) %360);
            console.log('random destination of winning item: ' + destinationDegrees);
            startRotating(arrowPosition);
        } catch (error) {
            console.log(error);
            popup.getElementsByTagName('h1')[0].innerHTML = `There is no item left!`;
            popup.getElementsByTagName('p')[0].innerHTML = ``;

            popup.classList.add('show');
        }
    }
    console.log(rad);
    let rotating = false;

    function showPopup()
    {
        popup.getElementsByTagName('h1')[0].innerHTML = `You have won: <br/>${degreeTable[winningItem]['fullText']}`;
        popup.getElementsByTagName('p')[0].innerHTML = `Do you want to accept your price?`;

        popup.classList.add('show');
    }

    function removePopup()
    {
        rotating = false;
        popup.classList.remove('show');
    }

    function increaseItemAgain()
    {
        if (winningItem == "")
            return;
        socket.emit('increaseItemCount', winningItem);
    }


    function calculateWinningItem() {
        return new Promise((resolve, reject) => {
            socket.emit('getRemainingItems', (response) => {
                let remainingItems = response;
                console.log(remainingItems);


                // Filter probabilities to only include existing items
                let validProbabilities = {};
                for (const [key, value] of Object.entries(probabilites)) {
                    if (remainingItems[key] > 0) {
                        validProbabilities[key] = value;
                    }
                }

                if (Object.keys(validProbabilities).length === 0) {
                    reject(new Error("No valid items available"));
                    return;
                }

                // Normalize probabilities
                let totalProbability = Object.values(validProbabilities).reduce((acc, curr) => acc + curr, 0);
                for (const key in validProbabilities) {
                    validProbabilities[key] /= totalProbability;
                }

                function pickItem() {
                    let randomNumber = Math.random();
                    console.log("random number: " + randomNumber);
                    let cumulativeProbability = 0;

                    for (const [key, value] of Object.entries(validProbabilities)) {
                        cumulativeProbability += value;
                        if (randomNumber < cumulativeProbability) {
                            resolve(key);
                            return;
                        }
                    }

                    // In case no item was picked (due to rounding errors), pick the last item
                    resolve(Object.keys(validProbabilities).pop());
                }

                pickItem();
            });
        });
}

function testProbabilites() {
    function pickItem() {
                    let randomNumber = Math.random();
                    let cumulativeProbability = 0;

                    for (const [key, value] of Object.entries(probabilites)) {
                        cumulativeProbability += value;
                        if (randomNumber < cumulativeProbability) {
                            return key;
                        }
                    }

                    // In case no item was picked (due to rounding errors), pick the last item
                    return(Object.keys(validProbabilities).pop());
    }

    let table = {};
    let runtime = 5000;

    for (const [key, values] of Object.entries(probabilites)){
        table[key] = 0;
    }

    for (let i = 0; i < runtime; i++) {
        let winningItem = pickItem();
        table[winningItem]++;

        
    }
    for (const [key,value] of Object.entries(table))
    {
        table[key] /= runtime;
    }

    console.log(table);
}
    
    function startRotating(arrowPosition) {
        let degrees = 0;
        let velocity = 6;//Math.random() * (VELOCITY_MAX-VELOCITY_MIN) + VELOCITY_MIN;
        let acceleration = 1.0;
        let runtime = 1;
        const numberOfTurns = 1;
        const totalDegrees = arrowPosition + numberOfTurns * 360;
        let interval = 1/32 * (Math.pow(totalDegrees, 2) + 12*totalDegrees + 32);
        
        let intervalID = setInterval(() => {
            let distance = 0;
            let logtime = 0;
            
            if (acceleration <= 0){
                // console.log('arrowPosition: ' + arrowPosition);
                // console.log('runtime: ' + runtime);
                clearInterval(intervalID);
                showPopup()
            }
            
            //logtime = Math.log(runtime/5000) / Math.log(1/2)+ 4;
            acceleration = acceleration - runtime/interval;//logtime/10000;
            distance = velocity * acceleration;
            degrees+= distance;
            
            //degrees%=360;
            rad.style.transform = `rotate(${degrees}deg)`;
            // console.log(`degrees: ${degrees}`);
            // console.log("acceleration: " + acceleration);
            // console.log('runtime ' + runtime);
            runtime++;
        }, 1);
            
        
    }
    