const dictionaryDatabaseLink = 'https://raw.githubusercontent.com/MinhasKamal/BengaliDictionary/master/BengaliDictionary.json';
const RADIX = 256;
const PRIME = 908209935089;  // 12 digit
const ROOT_PRIME = 95300

// Classes

// Only for debug purpose
class Debug{
    duplicateWords = 0
    maximumCollisionInFirstLayer(hashTable){
        var mx = -1;
        for(var i=0; i<hashTable.length; i++){
            mx = Math.max(mx, hashTable[i].length);
        }

        return mx;
    }

    statistics(hashTable){
        console.log('Total Words: ' + dictionary.numberOfWords);
        console.log('Total Duplicates: ' + this.duplicateWords);
        console.log('Maximum number of collisions in a particular slot: ' + 
            this.maximumCollisionInFirstLayer(hashTable));
    }
}

var debug = new Debug();

class Dictionary{
    database
    numberOfWords
};

class Hashing{
    hashTable;
    hashTableKeys;
    primaryHashA = null;
    primaryHashB = null;

    initializeHashTable(){
        this.hashTable = new Array(dictionary.numberOfWords);
        for(var i=0; i<dictionary.numberOfWords; i++){
            this.hashTable[i] = [];
        }
        this.hashTableKeys = new Array(dictionary.numberOfWords).fill(null);
    }


    convertFromWordToKey(word){
        // Lower case word expected
        var val = 0;
        var a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
        var b = Math.floor(Math.random() * PRIME);

        // Check if primaryHash a, b values are already defined. Defined would mean that
        // the hash has already been implemented and user is searching. 
        // Otherwise hashTable is just being generated and this function
        // is called by generatePrimaryHash(), not calculatePrimaryHash()
        if(this.primaryHashA == null || this.primaryHashB == null){
            this.primaryHashA = a;
            this.primaryHashB = b;
        }
        else{
            a = this.primaryHashA;
            b = this.primaryHashB;
        }

        /* Theoretically, we weren't supposed to take reminder of a prime
            inside the for loop. But as it happens, just a 7 characters Unicode
            word may map to approximately 10^17 (256^7) size integer. In JS, Number
            type has max limit of a decimal number of approximately 16 digits.
            Thus we cannot let a word be mapped to number more than that. As a 
            workaround, we have taken the remainder of a prime which is of 12 digits
            in decimal, so that the multiplication val*RADIX never crosses
            a number that is more than 16 digits.

            One complication of this is that there might be cases where two 'different'
            words mapping to the 'same' numerical key value even though theoretically
            every (a, b) should have generated a unique key pair (r, s). We can show
            that this possibility is very very low since in practice total number of words
            is only around ~17000 and the chance that two different words map to the
            same integer k (mod PRIME) is 17000/PRIME = 17000/908209935089 ~ 1.8e-6%

            Even with this complication, we can still implement the hash table
            without any issue since there would have been collision in the next step (mod m)
            anyway.
        */

        for(var i=0; i<word.length; i++){
            val = ( (val*RADIX) % PRIME + word.charCodeAt(i) ) % PRIME;
        }

        // Javascript Number type has a max safe value of some 16 digits integer
        // Since max(a) = 12 digit decimal and max(val) = 12 digit decimal, so
        // their product might cross that limit. Thus BigInt has been used. The
        // result is ultimately converted to Number type by taking remainder

        const aB = BigInt(a);
        const valB = BigInt(val);
        const primeB = BigInt(PRIME);
        const bB = BigInt(b);
        const out = (aB*valB + bB) % primeB;

        return Number(out);
    }


    calculatePrimaryHash(word){
        return this.convertFromWordToKey(word) % dictionary.numberOfWords;
    }

    calculateSecondaryHash(a, b, m, word){
        const aB = BigInt(a);
        const keyB = BigInt(this.convertFromWordToKey(word));

        return ( ( Number((aB*keyB)%BigInt(PRIME)) + b ) % PRIME ) % m;
    }

    collisionDetected(a, b, m, initialArray, finalArray){
        for(var i=0; i<initialArray.length; i++){
            var secondaryHashValue = this.calculateSecondaryHash(a, b, m, dictionary.database[initialArray[i]].en);

            if(finalArray[secondaryHashValue]==null){
                finalArray[secondaryHashValue] = initialArray[i];
            }
            else{
                return true;
            }
        }
        return false;
    }

    generateSecondaryHash(returnArray, primaryHashValue){
        // returnArray refers to the hashtable[i] where finally
        // the secondary hashtable should be implemented.

        var finalArrayLength = returnArray.length*returnArray.length;
        var finalArray = new Array(finalArrayLength).fill(null);
        
        // Make a copy of the returnArray that currently holds the
        // indices who map to the same primaryHashValue. This is to
        // avoid working with the final returnArray.
        var initialArray = Array.from(returnArray);

        // Try Random a, b and see if collision occurs
        var a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
        var b = Math.floor(Math.random() * PRIME);

        // Error Handling
        var itr = 0;

        while(this.collisionDetected(a, b, finalArrayLength, initialArray, finalArray)){
            
            // This portion is used solely for avoiding infinite loop in case of duplicate
            // words or other unexpected errors. Ideally the lines inside the if condition should never run.
            itr = itr+1;
            if(itr>100) {
                console.log('a = ' + a + ", b = " + b);
                console.log('Final Length: ' + finalArrayLength);
                console.log('The array: ');
                for(var i = 0; i<returnArray.length; i++){
                    console.log(dictionary.database[returnArray[i]].en)
                    console.log('Word Index: ' + returnArray[i] );
                    console.log("Key: " + this.convertFromWordToKey(dictionary.database[returnArray[i]].en));
                    console.log('Secondary Hashing: ' + this.calculateSecondaryHash(a, b, finalArrayLength, dictionary.database[returnArray[i]].en))
                }
                console.log('\n')
                console.log('Final array: ')
                for(var i=0; i<finalArray.length; i++){
                    console.log(i + ' ' + finalArray[i]);
                }

                throw Error('Too many iterations required!');
            }
            
            
            a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
            b = Math.floor(Math.random() * PRIME);

            // If collision is detected, it means the generated
            // finalArray is wrong and should be reset
            finalArray.fill(null);            
        }

        // while loop exists with finalArray completely generated since it was passed by reference
        // Save the values for a, b, and m
        this.hashTableKeys[primaryHashValue] = [a, b, finalArrayLength];

        return finalArray;  

    }

    noDuplicate(word, array){
        // Given a word and an array this function checks if the word already
        // exists in the array

        var unique = true;
        for(var i=0; i<array.length; i++){
            if(dictionary.database[array[i]].en == word){
                debug.duplicateWords++;
                unique = false;
                break;
            }
        }

        return unique;
    }


    generatePrimaryHash(word){       
        return this.convertFromWordToKey(word) % dictionary.numberOfWords;
    }

    generateHashTable(){
        this.initializeHashTable();

        for(var i=0; i<dictionary.numberOfWords; i++){
            // All words must be converted into lowercase first. We assume AM and am is the same word.
            dictionary.database[i].en = dictionary.database[i].en.toLowerCase();
            var word = dictionary.database[i].en;
            var numValue = this.generatePrimaryHash(word);

            // Secondary Hash is going to contain the indices of the dictionary.database
            // First check if this word already exists
            if(this.noDuplicate(word, this.hashTable[numValue])){
                this.hashTable[numValue].push(i);
            }
        }
        
        console.log('First Layer Hashing Done')

        // Detect Collisions in primary and apply secondary Hashing
        for(var i=0; i<dictionary.numberOfWords; i++){
            if(this.hashTable[i].length > 1){
                // Number of collision detected in this bucket

                this.hashTable[i] = this.generateSecondaryHash(this.hashTable[i], i);
                
                // The new size of hashtable[i].length should be the square of
                // the size hashtable[i] that was passed
            }
        }

        console.log('Done Hashing!');

        debug.statistics(this.hashTable);
    }
}


// Variables

var dictionary = new Dictionary();
var hashing = new Hashing();


// Main function running at page load

window.onload = function initializeHashing(){
    console.log('Working');
    dictionary = fetch(dictionaryDatabaseLink)
        .then(response => {
            if(!response.ok){
                throw new Error("HTTP error " + response.status);
            }
            // Printing response.json will execute the line instantly
            // without waiting for the promise to be fulfilled
            // If you want something to be executed after the promise
            // is fulfilled, try adding another then
            return response.json()
        })
        .then(json => {
            dictionary.database = json;
            dictionary.numberOfWords = Object.keys(dictionary.database).length;
        })
        .then(response => hashing.generateHashTable());
    
    console.log('Size printed');
}

// Actual search function invoked by onkeyup
function search(){
    var input = document.getElementById('query');
    var word = input.value.toLowerCase();
    var output = document.getElementById('output');
    var pHash = hashing.calculatePrimaryHash(word);
    var sHash;

    try{
        if(hashing.hashTableKeys[pHash] == null){
            throw 'Word Not Found';
        }

        const a = hashing.hashTableKeys[pHash][0];
        const b = hashing.hashTableKeys[pHash][1];
        const m = hashing.hashTableKeys[pHash][2];

        sHash = hashing.calculateSecondaryHash(a, b, m, word);
        if(dictionary.database[hashing.hashTable[pHash][sHash]].en == word){
            output.innerHTML = dictionary.database[hashing.hashTable[pHash][sHash]].bn;
        }
        else{
            throw 'Word Not Found';
        }
    }catch(err){
        console.log(err);
        output.innerHTML = '';
    };
    
}