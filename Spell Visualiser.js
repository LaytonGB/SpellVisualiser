/* TODO
- Make a way to set state variables
- test area calcs
- CONE NOTES
    -work from center outwards
    -use lines as max & min
*/

var SpellVisualiser = SpellVisualiser || (function () {
    'use strict';

    var stateName = 'SPELLVISUALISER';

    // -- SETTINGS DEFAULT --
    if (!state[`${stateName}_renderType`]) { state[`${stateName}_renderType`] = "3.5e" }; // "3.5e", "exact" or "5e"
    if (!state[`${stateName}_temp_fill`]) { state[`${stateName}_temp_fill`] = "transparent" }; // transparent or color hash
    if (!state[`${stateName}_temp_color`]) { state[`${stateName}_temp_color`] = "#000000" };
    if (!state[`${stateName}_temp_strokeWidth`]) { state[`${stateName}_temp_strokeWidth`] = "5" }; // pixels
    if (!state[`${stateName}_fill`]) { state[`${stateName}_fill`] = "transparent" };
    if (!state[`${stateName}_color`]) { state[`${stateName}_color`] = "#000000" };
    if (!state[`${stateName}_strokeWidth`]) { state[`${stateName}_strokeWidth`] = "5" };
    // -- END OF SETTINGS --

    var name = 'SV',
        nameError = name + ' ERROR',
        nameLog = name + ': ',
        playerName,
        wToPlayer = function (playerName) { return `/w ${playerName} ` },

        handleInput = function (msg) {
            playerName = msg.who.split(' ')[0];

            if (msg.type === 'api' && (msg.content.split(' ')[0] == '!sv' || msg.content.split(' ')[0] == '!svfast')) {
                let parts = msg.content.toLowerCase().split(' ');
                switch (parts[1]) {
                    case 'help':
                        showHelp();
                        showConfig();
                        break;
                    case 'config':
                        setConfig(msg);
                        break;
                    default:
                        if (msg.selected && msg.selected[0] && !msg.selected[1]) {
                            if (msg.selected[0]._type == 'path') {
                                transformTemplate(msg, false)
                            } else if (parts[0] == '!svfast') {
                                transformTemplate(msg, true)
                            } else {
                                spellVisualiser(msg)
                            }
                        } else {
                            error(`Must have 1 token selected.`, 1)
                            return;
                        }
                        break;
                }
            }
        },

        showHelp = function () {
            let commandsArr = [
                [
                    '!sv',
                    'A token or path must be selected.',
                    'When run, the specified shape will generate around the selected token. If that shape is selected and "!sv" is called, the shape will become gridded.',
                    'shape, radius',
                    '{{shape="sphere" or "cone"}}{{radius=The radius in game units (eg. "20" for 20 ft)}}'
                ],
                [
                    '!svfast',
                    'A token must be selected.',
                    'When run, the specified shape will generate in gridded form around the selected token.',
                    'shape, radius',
                    '{{shape="sphere" or "cone"}}{{radius=The radius in game units (eg. "20" for 20 ft)}}'
                ]
            ]
            let commandStyle = `background-color: rgba(0, 0, 0, 0.5); color: White; padding: 3px; border-radius: 5px;`;
            _.each(commandsArr, function (command, index) {
                toPlayer(`&{template:default} {{name=<span style="${commandStyle}">${command[0]}</span> Help}} {{Requirements=${command[1]}}} {{Function=${command[2]}}} {{Variables=${command[3]}}} ${command[4]}`)
            })
        },

        showConfig = function () {
            let output = `&{template:default} {{name=Spell Visualiser Settings}}`
            let settingsArr = [
                [state[`${stateName}_renderType`], 'renderType', 'Curve Render Style', '|3.5e|exact|5e'],
                [state[`${stateName}_temp_fill`], 'temp_fill', 'Fill Color', '|transparent'],
                [state[`${stateName}_temp_color`], 'temp_color', 'Line Color', '|#000000'],
                [state[`${stateName}_temp_strokeWidth`], 'temp_strokeWidth', 'Line Width', '|5'],
                [state[`${stateName}_fill`], 'fill', 'Gridded Fill Color', '|transparent'],
                [state[`${stateName}_color`], 'color', 'Gridded Line Color', '|#000000'],
                [state[`${stateName}_strokeWidth`], 'strokeWidth', 'Gridded Stroke Width', '|5']
            ]
            _.each(settingsArr, setting => {
                output += `{{${setting[2]}=[${setting[0]}](!sv config ${setting[1]} ?{${setting[2]}${setting[3]}})}}`;
            })
            toPlayer(output);
        },

        setConfig = function (msg) {
            let parts = msg.content.split(' ');
            if (parts[2]) {
                let setting = parts[2];
                let value = parts[3];
                if (state[`${stateName}_${setting}`]) {
                    state[`${stateName}_${setting}`] = value;
                    toPlayer(`Setting '${setting}' set to '${value}'.`, true)
                } else {
                    error(`Could not find setting '${setting}'.`)
                    return;
                }
            }
            showConfig();
            return;
        },

        spellVisualiser = function (msg) {
            let token = getObj(msg.selected[0]._type, msg.selected[0]._id),
                parts = msg.content.toLowerCase().split(' '),

                distPerSquare = 5,
                radiusInSquares = !isNaN(parts[2]) ? Math.round(parseInt(parts[2])) / distPerSquare : 4,
                square = 70,
                radius = square * radiusInSquares,
                sphereModA = 2.2335627649005440597417264304594,
                sphereModB = 0.64421168074312136535769724730926;

            if (radiusInSquares % 1) {
                toChat(`Radius must be a multiple of distance per square. Map distance is current 5 ft per square. You entered '${parts[2]}'.`)
                return;
            }

            let path;
            switch (parts[1]) {
                case 'cone':
                    path = [
                        ['M', 0, +radius],
                        ['C', 0, +radius / sphereModA, +radius / sphereModA, 0, +radius, 0],
                        ['L', +radius, +radius],
                        ['L', 0, +radius],
                    ];
                    radius += square / 2;
                    break;
                case 'sphere':
                    radius += square / 2;
                    path = [
                        ['M', 0, +radius],
                        ['C', 0, +radius / sphereModA, +radius / sphereModA, 0, +radius, 0],
                        ['C', +radius / sphereModB, 0, +radius * 2, +radius / sphereModA, +radius * 2, +radius],
                        ['C', +radius * 2, +radius / sphereModB, +radius / sphereModB, +radius * 2, +radius, +radius * 2],
                        ['C', +radius / sphereModA, +radius * 2, 0, +radius / sphereModB, 0, +radius]
                    ];
                    break;
                default:
                    error(`Expected spell shape. Instead recieved '${parts[1]}'.`, 2)
                    return;
            }
            tempPath = create(token, path, (radius * 2), true, parts[1]);
            toBack(tempPath);
            return;
        },

        transformTemplate = function (msg, fast) {
            let distPerSquare = 5,
                square = 70,

                oldPath = getObj(msg.selected[0]._type, msg.selected[0]._id),
                oldPathShape = !fast ? oldPath.get('controlledby').split(',')[1] : msg.content.split(' ')[1],
                oldPathHeight = !fast ? oldPath.get('height') : msg.content.split(' ')[2] % distPerSquare == 0 ? ((msg.content.split(' ')[2] / distPerSquare * 2) + 1) * square : 9 * square,
                oldPathRotation = !fast ? oldPath.get('rotation') : 0,

                radiusInSquares = +oldPathHeight / 2 / +square,
                radius = +square * +radiusInSquares;

            switch (oldPathShape) {
                case 'sphere':
                    let newSphere = create(oldPath, buildSphere(), oldPathHeight, false);
                    if (!fast) { oldPath.remove(); }
                    return;
                case 'cone':
                    spellVisualiser(msg)
                    return;
                default:
                    error(`Currently API can only grid-ify shape 'sphere'.<br>You tried to grid-iphy shape '${oldPathShape}'.`)
                    return;

                    function buildSphere() {
                        let path = buildPath();
                        let pathLength = path.length;
                        for (let i = 0.5; i < radiusInSquares; i++) {
                            path.push(['L', (i) * square, path[pathLength - ((i + 1.5) * 2)][2]])
                            path.push(['L', (i + 1) * square, path[pathLength - ((i + 1.5) * 2)][2]])
                        }
                        for (let i = path.length - 1; i >= 0; i--) {
                            path.push(['L', path[i][1], -path[i][2]])
                        }
                        return path;
                    }
                    function buildPath() {
                        let path = [];
                        path[0] = ['M', -radius, 0];
                        switch (state[`${stateName}_renderType`].toLowerCase()) {
                            case '3.5e':
                                for (let i = -radiusInSquares; i < 0; i++) {
                                    let y = radiusInSquares;
                                    let squares = getSquares();
                                    let lim = radiusInSquares - .5;
                                    while (squares > lim) {
                                        y--;
                                        squares = getSquares();
                                    }
                                    function getSquares() {
                                        return Math.floor(Math.max(y, Math.abs(i))) + Math.floor(Math.floor(Math.min(y, Math.abs(i))) / 2);
                                    }
                                    path.push(['L', (i) * square, -y * square])
                                    path.push(['L', (i + 1) * square, -y * square])
                                }
                                break;
                            case 'exact':
                                for (let i = -radiusInSquares; i < 0; i++) {
                                    let yCalc = Math.sqrt((radiusInSquares ** 2) - ((i + .5) ** 2));
                                    let y = Math.ceil(yCalc) ? Math.ceil(yCalc) - .5 : 0;
                                    path.push(['L', (i) * square, -y * square])
                                    path.push(['L', (i + 1) * square, -y * square])
                                }
                                break;
                            case '5e':
                                for (let i = -radiusInSquares; i < 0; i++) {
                                    let y = radiusInSquares;
                                    path.push(['L', (i) * square, -y * square])
                                    path.push(['L', (i + 1) * square, -y * square])
                                }
                                break;
                            default:
                                error(`'state.${stateName}_renderType' was invalid. Reset to '3.5e' measurement style.`);
                                state[`${stateName}_renderType`] = '3.5e';
                                path = buildPath(shape);
                                break;
                        }
                        return path;
                    }
            }
        },

        create = function (obj, path, dim, isTemp, shape) {
            checkState();
            let temp = isTemp ? "temp_" : "",
                shapeControl = shape ? `,${shape}` : "",
                newObj = createObj('path', {
                    _pageid: obj.get('_pageid'),
                    _path: JSON.stringify(path),
                    fill: state[`${stateName}_${temp}fill`],
                    stroke: state[`${stateName}_${temp}color`],
                    stroke_width: state[`${stateName}_${temp}strokeWidth`],
                    width: dim,
                    height: dim,
                    top: obj.get('top'),
                    left: obj.get('left'),
                    layer: 'objects',
                    controlledby: `all${shapeControl}`
                })
            return newObj;
        },

        checkState = function () {
            if (['3.5e', 'exact', '5e'].indexOf(state[`${stateName}_renderType`]) == -1) {
                error(`Render Type was incorrectly set to '${state[`${stateName}_renderType`]}' but has now been reset to '3.5e'.`);
                state[`${stateName}_renderType`] = '3.5e';
            };
            if (!state[`${stateName}_temp_fill`].match(/(#)\w{6}/g) && state[`${stateName}_temp_fill`] != 'transparent') {
                error(`Shape Fill was incorrectly set to '${state[`${stateName}_temp_fill`]}' but has now been reset to 'transparent'.`);
                state[`${stateName}_temp_fill`] = 'transparent';
            };
            if (state[`${stateName}_temp_color`] == 'transparent') {
                error(`Line Color was incorrectly set to '${state[`${stateName}_temp_color`]}' but has now been reset to black (#000000).`);
                state[`${stateName}_temp_color`] = '#000000';
            };
            if (state[`${stateName}_temp_strokeWidth`] == 0 || isNaN(state[`${stateName}_temp_strokeWidth`])) {
                error(`Line Thickness was incorrectly set to '${state[`${stateName}_temp_strokeWidth`]}' but has now been reset to '5' pixels.`);
                state[`${stateName}_temp_strokeWidth`] = 5;
            };
            if (!state[`${stateName}_fill`].match(/(#)\w{6}/g) && state[`${stateName}_fill`] != 'transparent') {
                error(`Gridded Shape Fill was incorrectly set to '${state[`${stateName}_fill`]}' but has now been reset to 'transparent'.`);
                state[`${stateName}_fill`] = 'transparent';
            };
            if (state[`${stateName}_color`] == 'transparent') {
                error(`Gridded Line Color was incorrectly set to '${state[`${stateName}_color`]}' but has now been reset to black (#000000).`);
                state[`${stateName}_color`] = '#000000';
            };
            if (state[`${stateName}_strokeWidth`] == 0 || isNaN(state[`${stateName}_strokeWidth`])) {
                error(`Gridded Line Thickness was incorrectly set to '${state[`${stateName}_strokeWidth`]}' but has now been reset to '5' pixels.`);
                state[`${stateName}_strokeWidth`] = 5;
            };
            return;
        },

        toPlayer = function (message, success) {
            if (!success) {
                sendChat(name, wToPlayer(playerName) + message);
            } else {
                sendChat(name, wToPlayer(playerName) + '<br><div style="background-color: #5cd65c; color: Black; padding: 5px; border-radius: 10px;">' + message + '</div>');
            }
        },

        error = function (error, code) {
            sendChat(nameError, `${wToPlayer(playerName)} <br><div style="background-color: #ff6666; color: Black; padding: 5px; border-radius: 10px;">**${error}** Error code ${code}.</div>`);
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