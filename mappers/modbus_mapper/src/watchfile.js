const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const filename = 'dpl/deviceProfile.json';
const util = require('util');

var devIns = new Map();
var devMod = new Map();
var devPro = new Map();
var modVisitr = new Map();

// watchChange monitor dpl configuration file, reload if changed
function watchChange(paths, onChange) {
    if (typeof onChange !== 'function') throw Error(`onChange (${onChange}) is not a function`);

    if (!Array.isArray(paths)) paths = [paths];

    paths.forEach(path => {
        if (!(path && fs.existsSync(path))) throw Error(`can't find path ${path}`);
    });

    let watcher = chokidar.watch(paths);
    watcher.on('ready', ()=>{
        watcher.on('add', ()=>{
            logger.info('watched file added, load dpl config');
            setTimeout(() => {
                onChange(filename);
            }, 5000);
        }).on('change', ()=> {
            logger.info('watched file change, load dpl config');
            setTimeout(() => {
                onChange(filename);
            }, 5000);
        });
    });
}

// loadDpl load dpl configuration file
function loadDpl(filename, callback) {
    fs.readFile(filename, 'utf-8', (err, data)=>{
        if (err) {
            logger.error('load dpl config error: ', err);
        } else {
            let dplConfigs = JSON.parse(data);
            processData(dplConfigs, callback);
        }
    });
}

// loadConfig load mqtt configuration file
function loadConfig(filename, callback) {
    fs.readFile(filename, 'utf-8', (err, data)=>{
        if (err) {
            logger.error('load config error: ', err);
        } else {
            let configs = JSON.parse(data);
            if (process.env.CONNECTOR_MQTT_PORT != undefined) {
                configs.mqtt_port = process.env.CONNECTOR_MQTT_PORT
            }else {
                configs.mqtt_port = 1883
            }
            if (process.env.CONNECTOR_MQTT_IP != undefined) {
                configs.mqtt_ip = process.env.CONNECTOR_MQTT_IP
            }else {
                configs.mqtt_ip = "127.0.0.1"
            }
            if (process.env.CONNECTOR_DPL_NAME != undefined) {
                configs.dpl_name = process.env.CONNECTOR_DPL_NAME
            }else {
                configs.dpl_name = "dpl/deviceProfile.json"
            }
            callback(null, configs);
        }
    });
}

// processData parse dpl config for each deviceInstance
function processData(dplConfigs, callback) {
    if (dplConfigs.deviceInstances != null ) {
        for (let i = 0; i < dplConfigs.deviceInstances.length; i++) {
            buildMaps(dplConfigs, i, (err) => {
                if (err) {
                    logger.error('build devIns maps error: ', err)
                }
            });
        }
    }
    if (dplConfigs.deviceModels != null ) {
        for (let i = 0; i < dplConfigs.deviceModels.length; i++) {
            for (let j = 0; j < dplConfigs.deviceModels[i].properties.length; j++) {
                buildVisitorMaps(dplConfigs, i, j);
            }
        }
    }
    callback(devIns, devMod, devPro, modVisitr);
}

// buildMaps build three maps 1.map[deviceID]deviceInstance, 2.map[deviceID]deviceModel, 3.map[deviceID]protocol
function buildMaps(dplConfigs, i) {
    devIns.set(dplConfigs.deviceInstances[i].id, dplConfigs.deviceInstances[i]);
    let foundMod = dplConfigs.deviceModels.findIndex((element)=>{
        return element.name === dplConfigs.deviceInstances[i].model;
    });
    if (foundMod != -1) {
        devMod.set(dplConfigs.deviceInstances[i].id, dplConfigs.deviceModels[foundMod]);
    } else {
        logger.error('failed to find model[%s] for deviceid', dplConfigs.deviceModels[i].model);
    }

    let foundPro = dplConfigs.protocols.findIndex((element)=>{
        return element.name === dplConfigs.deviceInstances[i].protocol;
    });
    if (foundPro != -1) {
        devPro.set(dplConfigs.deviceInstances[i].id, dplConfigs.protocols[i]);
    } else {
        logger.error('failed to find protocol[%s] for deviceid', dplConfigs.deviceModels[i].protocol);
    }
}

// buildVisitorMaps build map[model-property-protocol]propertyVisitor
function buildVisitorMaps(dplConfigs, i, j) {
    let foundVisitor = dplConfigs.deviceInstances.findIndex((element)=>{
        return element.propertyVisitors[j].modelName === dplConfigs.deviceModels[i].name && element.propertyVisitors[j].propertyName === dplConfigs.deviceModels[i].properties[j].name;
    });
    if (foundVisitor != -1) {
        modbusProtocolTransfer(dplConfigs.deviceInstances[i].propertyVisitors[j].protocol, (transferedProtocol)=> {
            modVisitr.set(util.format('%s-%s-%s', dplConfigs.deviceInstances[i].propertyVisitors[j].modelName, dplConfigs.deviceInstances[i].propertyVisitors[j].propertyName,transferedProtocol ), dplConfigs.deviceInstances[i].propertyVisitors[j]);
        });
    } else {
        logger.error('failed to find visitor for model[%s], property[%s]', dplConfigs.deviceModels[i].name, dplConfigs.deviceModels[i].properties[j].name);
    }
}

function modbusProtocolTransfer(protocol, callback) {
    let transferedProtocol;
    if (protocol === 'modbus-rtu' || protocol === 'modbus-tcp') {
        transferedProtocol = 'modbus';
    } else {
        transferedProtocol = protocol;
    }
    callback(transferedProtocol)
}

module.exports = {watchChange, loadDpl, loadConfig};
