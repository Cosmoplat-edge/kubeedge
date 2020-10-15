const defaultTopicPrefix = '\$hw/events/device/';
const defaultDirectTopicPrefix = '$hw/devices/';
const twinDeltaTopic = defaultTopicPrefix + '+/twin/update/delta';
const twinUpdateTopic = '/twin/update';
const twinGetResTopic = defaultTopicPrefix + '+/twin/get/result';
const twinGetTopic = '/twin/get';
const directGetTopic = '/events/properties/get';

//dataTopic
const defaultDataTopicPrefix = '\$ke/events/device/';
const dataUpdateTopic = '/data/update'


module.exports = {
    twinDeltaTopic,
    twinUpdateTopic,
    defaultTopicPrefix,
    defaultDirectTopicPrefix,
    directGetTopic,
    twinGetTopic,
    twinGetResTopic,
    defaultDataTopicPrefix,
    dataUpdateTopic
};
