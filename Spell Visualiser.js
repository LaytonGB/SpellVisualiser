var SpellVisualiser = SpellVisualiser || (function () {

    var state = 'SPELLVISUALISER',
        name = 'SV',
        nameError = name + ' ERROR',
        nameLog = name + ': ',
        playerName,
        wToPlayer = function (playerName) { return `/w ${playerName} ` },

        handleInput = function (msg) {
            playerName = msg.who.split(' ')[0];

            if (msg.type === 'api' && msg.content.split(' ')[0] == '!sv') {
                if (msg.selected && msg.selected[0] && !msg.selected[1]) {
                    if (msg.selected[0]._type == 'path') {
                        transformTemplate(msg, false)
                    } else {
                        spellVisualiser(msg)
                    }
                } else {
                    error(`Must have 1 token selected.`, 1)
                    return;
                }
            } else if (msg.type === 'api' && msg.content.split(' ')[0] == '!svfast') {
                transformTemplate(msg, true)
            }
        },

        spellVisualiser = function (msg) {
            let token = getObj(msg.selected[0]._type, msg.selected[0]._id),
                pageID = Campaign().get('playerpageid'),
                parts = msg.content.toLowerCase().split(' '),

                distPerSquare = 5,
                radiusInSquares = !isNaN(parts[2]) ? Math.round(parseInt(parts[2])) / distPerSquare : 4,
                square = 70,
                radius = +square * +radiusInSquares,
                sphereModA = 2.2335627649005440597417264304594,
                sphereModB = 0.64421168074312136535769724730926;

            if (radiusInSquares % 1) {
                toChat(`Radius must be a multiple of distance per square. Map distance is current 5 ft per square. You entered '${parts[2]}'.`)
                return;
            }

            switch (parts[1]) {
                case 'cone':
                    path = [
                        ['M', 0, +radius],
                        ['C', 0, +radius / sphereModA, +radius / sphereModA, 0, +radius, 0],
                        ['L', +radius, +radius],
                        ['L', 0, +radius],
                    ],
                        tempPath = createObj('path', {
                            _pageid: pageID,
                            _path: JSON.stringify(path),
                            width: radius * 2 + square,
                            height: radius * 2 + square,
                            top: +token.get('top'),
                            left: +token.get('left'),
                            layer: 'objects',
                            controlledby: `all,cone`
                        });
                    toBack(tempPath);
                    return;
                case 'sphere':
                    radius += +square / 2;
                    path = [
                        ['M', 0, +radius],
                        ['C', 0, +radius / sphereModA, +radius / sphereModA, 0, +radius, 0],
                        ['C', +radius / sphereModB, 0, +radius * 2, +radius / sphereModA, +radius * 2, +radius],
                        ['C', +radius * 2, +radius / sphereModB, +radius / sphereModB, +radius * 2, +radius, +radius * 2],
                        ['C', +radius / sphereModA, +radius * 2, 0, +radius / sphereModB, 0, +radius]
                    ],
                        tempPath = createObj('path', {
                            _pageid: pageID,
                            _path: JSON.stringify(path),
                            width: radius * 2,
                            height: radius * 2,
                            top: +token.get('top'),
                            left: +token.get('left'),
                            layer: 'objects',
                            controlledby: `all,sphere`
                        });
                    toBack(tempPath);
                    return;
                default:
                    error(`Expected spell shape. Instead recieved '${parts[1]}'.`, 2)
            }
        },

        transformTemplate = function (msg, fast) {
            let distPerSquare = 5,
                square = 70,
                
                oldPath = getObj(msg.selected[0]._type, msg.selected[0]._id),
                oldPathShape = !fast ? oldPath.get('controlledby').split(',')[1] : msg.content.split(' ')[1],
                oldPathHeight = !fast ? oldPath.get('height') : msg.content.split(' ')[2] % distPerSquare == 0 ? ( (msg.content.split(' ')[2] / distPerSquare *2) + 1 ) * square : 9 * square,
                oldPathWidth = !fast ? oldPath.get('width') : msg.content.split(' ')[2] % distPerSquare == 0 ? ( (msg.content.split(' ')[2] / distPerSquare *2) + 1 ) * square : 9 * square,
                oldPathRotation = !fast ? oldPath.get('rotation') : 0,

                radiusInSquares = +oldPathHeight / 2 / +square,
                radius = +square * +radiusInSquares;

            switch (oldPathShape) {
                case 'sphere':
                    let newSphere = createObj('path', {
                        _pageid: oldPath.get('_pageid'),
                        _path: JSON.stringify(buildSphere()),
                        width: oldPathWidth,
                        height: oldPathHeight,
                        top: oldPath.get('top'),
                        left: oldPath.get('left'),
                        layer: 'objects',
                        controlledby: 'all'
                    });
                    if (!fast) {oldPath.remove();}
                    return;
                // case 'cone':
                //     let newCone = createObj('path', {
                //         _pageid: oldPath.get('_pageid'),
                //         _path: JSON.stringify(buildCone()),
                //         width: oldPathWidth,
                //         height: oldPathHeight,
                //         top: oldPath.get('top'),
                //         left: oldPath.get('left'),
                //         layer: 'objects',
                //         controlledby: 'all'
                //     });
                //     oldPath.remove();
                //     return;
                default:
                    error(`Currently API can only grid-ify shape 'sphere'.<br>You tried to grid-iphy shape '${oldPathShape}'.`)
                    return;

                function buildPath() {
                    let path = [];
                    path[0] = ['M', -radius, 0];
                    for (let i = -radiusInSquares; i < 0; i++) {
                        let yCalc = Math.sqrt((radiusInSquares ** 2) - ((i + .5) ** 2));
                        let y = Math.ceil(yCalc) ? Math.ceil(yCalc) - .5 : 0;
                        let squares = Math.floor( Math.max(y,Math.abs(i)) ) + Math.floor( Math.floor(Math.min(y,Math.abs(i))) /2 );
                        let lim = radiusInSquares-.5;
                        while ( squares > lim ) {
                            y--;
                            squares = Math.floor( Math.max(y,Math.abs(i)) ) + Math.floor( Math.floor(Math.min(y,Math.abs(i))) /2 );
                        }
                        path.push(['L', (i) * square, -y * square])
                        path.push(['L', (i + 1) * square, -y * square])
                    }
                    return path;
                }
                function buildSphere() {
                    let path = buildPath();
                    let pathLength = path.length;
                    for (let i = 0.5; i < radiusInSquares; i++) {
                        path.push(['L', (i) * square, path[pathLength - ((i+1.5)*2)][2]])
                        path.push(['L', (i + 1) * square, path[pathLength - ((i+1.5)*2)][2]])
                    }
                    for (let i = path.length-1; i >= 0; i--) {
                        path.push(['L', path[i][1], -path[i][2]])
                    }
                    return path;
                }
                function buildCone() {
                    let path = buildPath();

                    path.pop()
                    path.push(['L', 0, -radius])
                    path.push(['L', 0, -square/2])
                    path.push(['L', path[0][1], -square/2])
                    toChat(`Path Final: <br>${JSON.stringify(path)}`)
                    return path;
                }
            }
        },

        toPlayer = function (message) {
            sendChat(name, wToPlayer(playerName) + message);
        },

        error = function (error, code) {
            sendChat(nameError, `/w ${playerName} **${error}** Error code ${code}.`);
            log(nameLog + error + ` Error code ${code}.`);
        },

        toChat = function (message) {
            sendChat(name, message)
        },

        registerEventHandlers = function () {
            on('chat:message', handleInput);
        };

    return {
        RegisterEventHandlers: registerEventHandlers
    };
}())

on('ready', function () {
    'use strict';

    SpellVisualiser.RegisterEventHandlers();
});