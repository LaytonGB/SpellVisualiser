var SpellVisualiser = SpellVisualiser || (function(){
    
    var state = 'SPELLVISUALISER',
    name = 'SV',
    nameError = name+' ERROR',
    nameLog = name+': ',
    playerName,
    wToPlayer = function(playerName) {return `/w ${playerName} `},

    handleInput = function(msg){
        playerName = msg.who.split(' ', 1);

        if (msg.type === 'api' && msg.content.split(' ')[0] == '!sv'){
            if (msg.selected && msg.selected[0] && !msg.selected[1]){
                if(msg.selected[0]._type == 'path'){
                    transformTemplate(msg)
                } else {
                    spellVisualiser(msg)
                }
            } else {
                error(`Must have 1 token selected.`, 1)
                return;
            }
        }
    },

    spellVisualiser = function(msg){
        let token = getObj(msg.selected[0]._type, msg.selected[0]._id);
        let pageID = Campaign().get('playerpageid');

        let parts = msg.content.split(' ');
        let squares = !isNaN(parts[2]) ? Math.ceil(parseInt(parts[2])) / 5 : 5;
        let pixels = 70;
        if (squares % 1) {
            toChat(`Radius must be a multiple of map distance / square. Map distance is 5 ft / square. You entered '${parts[2]}'.`)
            return;
        }
        
        switch(parts[1]){
            case 'cone':
                let diagonal = Math.sqrt(Math.pow(+pixels*+squares, 2)/1.9);
                let path = [
                    ['M', 0, +pixels*+squares],
                    ['L', 0, -pixels*+squares],
                    ['L', 0, 0],
                    ['L', +pixels*+squares, 0],
                    ['L', 0, 0],
                    ['L', -pixels*+squares, 0],
                    ['L', 0, 0],
                    ['L', -diagonal, -diagonal],
                    ['C', -diagonal/2, -diagonal-diagonal/2, +diagonal/2, -diagonal-diagonal/2, +diagonal, -diagonal],
                    //['Q', 0, 4*(Math.sqrt(2)-pixels*+squares)/3, -diagonal, -diagonal],
                    ['L', 0, 0],
                    ['L', 0, +pixels*+squares]
                ]
                createObj('path', {
                    _pageid: pageID,
                    _path: JSON.stringify(path),
                    width: 70*+squares*2,
                    height: 70*+squares*2,
                    top: +token.get('top'),
                    left: +token.get('left'),
                    layer: 'objects',
                    controlledby: 'all,cone'
                })
                return;
            default:
                error(`Expected spell shape. Instead recieved '${parts[1]}'.`, 2)
        }
    },

    transformTemplate = function(msg) {
        let oldPath = getObj(msg.selected[0]._type, msg.selected[0]._id);
        let oldPathShape = oldPath.get('controlledby').split(',')[1];
        let pageID = oldPath.get('_pageid');

        if (oldPathShape == 'cone'){
            let angle = oldPath.get('rotation');
            let areaEq = 'lineB <= y <= lineA && (x-x1)^2 + (y-y1)^2 <= rad^2';
        } else {
            error(`Currently API can only deal with shape 'cone'.`)
            return;
        }
    },

    toPlayer = function(message) {
        sendChat(name, wToPlayer(playerName)+message);
    },

    error = function(error, code) {
        sendChat(nameError, `/w ${playerName} **${error}** Error code ${code}.`);
        log(nameLog+error+` Error code ${code}.`);
    },

    toChat = function(message) {
        sendChat(name, message)
    },

    registerEventHandlers = function() {
        on('chat:message', handleInput);
    };

    return {
        RegisterEventHandlers: registerEventHandlers
    };
}())

on('ready', function(){
    'use strict';

    SpellVisualiser.RegisterEventHandlers();
});