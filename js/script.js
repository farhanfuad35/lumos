const dictionaryDatabaseLink = 'https://raw.githubusercontent.com/MinhasKamal/BengaliDictionary/master/BengaliDictionary.json';
const RADIX = 26;
const PRIME = 908209935089;  // 12 digit
// var DICTIONARY_SIZE

// Classes

// Only for debug purpose
class Debug{
    maximumCollisionInFirstLayer(hashTable){
        var mx = -1;
        for(var i=0; i<hashTable.length; i++){
            mx = Math.max(mx, hashTable[i].length);
        }

        return mx;
    }   
}

var debug = new Debug();

class Dictionary{
    database
    numberOfWords
};

class Hashing{
    hashTable;

    initializeHashTable(){
        this.hashTable = new Array(dictionary.numberOfWords);
        for(var i=0; i<dictionary.numberOfWords; i++){
            this.hashTable[i] = [];
        }
    }

    calculateFirstLayerValue(word){
        word = word.toLowerCase();
        var val = 0;
        for(var i=0; i<word.length; i++){
            val = ( (val*RADIX) % PRIME + word.charCodeAt(i) ) % PRIME;
        }
        return val % dictionary.numberOfWords;
    }

    generateHashTable(){
        console.log('Printing');
        console.log(dictionary.numberOfWords);

        this.initializeHashTable();

        for(var i=0; i<dictionary.numberOfWords; i++){
            var numValue = this.calculateFirstLayerValue(dictionary.database[i].en);
            this.hashTable[numValue].push(i);
        }
        
        console.log('First Layer Hashing Done');
        console.log(debug.maximumCollisionInFirstLayer(this.hashTable));

        // Detect Collisions in first layer and apply second Hashing
        // for(var i=0; i<dictionary.numberOfWords; i++){
            
        // }
    }
}


// Variables

var dictionary = new Dictionary();
var hashing = new Hashing();
// var hashTable;


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

