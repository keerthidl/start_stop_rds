let AWS = require("aws-sdk")

AWS.config.update({
    accessKeyId:"",
    secretAccessKey:"",
    region:""
})

let rds = new AWS.RDS()

const tagStartStop = 'Auto-StartStop-Enabled'

function startStopRdsDB(params) {
    return new Promise(async (resolve, reject)=>{
        let instanceList = []
        let clusterList = []
        let startedInstanceCount = 0;
        let stoppedInstanceCount = 0;
        let startedClusterCount = 0;
        let stoppedClusterCount = 0;
    
        try {
            console.log("== getting the RDS instance list.");
            instanceList = await getRsInstanceList()
        } catch (error) {
            reject(error)
        }

        for(instance of instanceList){
            try {
                if(['mysql','mariadb','postgres'].indexOf(instance.Engine) > -1 || instanceList.Engine.includes('oracle')){
                    let tags = await getRdsResourceTags(instance.DBInstanceArn);

                    for (let tag of tags) {

                        if (tag.Key == tagStartStop) {

                            console.log("Current status of DB instance " + instance.DBInstanceIdentifier + " is " + instance.DBInstanceStatus);

                            if (action == 'start' && instance.DBInstanceStatus == 'stopped') {

                                console.log("DB instance " + instance.DBInstanceIdentifier + " that can be started.");
                                await startRdsInstance(instance.DBInstanceIdentifier);
                                console.log("DB instance " + instance.DBInstanceIdentifier + " is started.");
                                startedInstanceCount++;
                            }

                            if (action == 'stop' && instance.DBInstanceStatus == 'available') {

                                console.log("DB instance " + instance.DBInstanceIdentifier + " that can be stopped.");
                                await stopRdsInstance(instance.DBInstanceIdentifier);
                                console.log("DB instance " + instance.DBInstanceIdentifier + " is stopped.");
                                stoppedInstanceCount++;
                            }
                        }
                    }
                }
            } catch (error) {
                reject(error)
            }

        }

        if (startedInstanceCount == 0 && action == 'start') console.log("Found 0 RDS instance that can be started.");
        if (stoppedInstanceCount == 0 && action == 'stop') console.log("Found 0 RDS instance that can be stopped.");

        try {
            console.log("=== Get RDS cluster list.");
            clusterList = await getRdsClusterList();

        } catch (err) {
            reject(err);
        }

        for (let cluster of clusterList) {

            try {

                if (cluster.Engine.includes('aurora')) {

                    let tags = await getRdsResouceTags(cluster.DBClusterArn);

                    for (let tag of tags) {

                        if (tag.Key == tagStartStop) {

                            console.log("Current status of DB cluster " + cluster.DBClusterIdentifier + " is " + cluster.Status);

                            if (action == 'start' && cluster.Status == 'stopped') {

                                console.log("DB cluster " + cluster.DBClusterIdentifier + " that can be started.");
                                await startRdsCluster(cluster.DBClusterIdentifier);
                                console.log("DB cluster " + cluster.DBClusterIdentifier + " is started.");
                                startedClusterCount++;
                            }

                            if (action == 'stop' && cluster.Status == 'available') {

                                console.log("DB cluster " + cluster.DBClusterIdentifier + " that can be stopped.");
                                await stopRdsCluster(cluster.DBClusterIdentifier);
                                console.log("DB cluster " + cluster.DBClusterIdentifier + " is stopped.");
                                stoppedClusterCount++;
                            }
                        }
                    }
                }
            } catch (err) {

                reject(err);
            }
        }

        if (startedClusterCount == 0 && action == 'start') console.log("Found 0 RDS cluster that can be started.");
        if (stoppedClusterCount == 0 && action == 'stop') console.log("Found 0 RDS cluster that can be stopped.");

        resolve("Method startStopRdsDB() is done.");
    })
    }

    function getRsInstanceList() {
        return new Promise((resolve, reject) =>{
            let params = null

            rds.describeDBInstances(params, function(err, data){
                if(err){
                    reject(err)
                }else{
                    resolve(data.DBInstances)
                }
            })
        })
    }

    function getRdsResourceTags(){
        let params = null
        return new Promise((resolve, reject)=> {
            rds.listTagsForResource(params, function(err, data){
                if(err){
                    reject(err)
                }else{
                    resolve (data.TagList)
                }
            })
        })
    }

    function startRdsInstance(dbInstanceIdentifier) {

        return new Promise((resolve, reject) => {
    
            let params = {
                DBInstanceIdentifier: dbInstanceIdentifier
            };
    
            rds.startDBInstance(params, function (err, data) {
    
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    
    function stopRdsInstance(dbInstanceIdentifier) {
    
        return new Promise((resolve, reject) => {
    
            let params = {
                DBInstanceIdentifier: dbInstanceIdentifier
            };
    
            rds.stopDBInstance(params, function (err, data) {
    
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    
    function getRdsClusterList() {
    
        return new Promise((resolve, reject) => {
    
            let params = null;
    
            rds.describeDBClusters(params, function (err, data) {
    
                if (err) {
                    reject(err);
                } else {
                    resolve(data.DBClusters);
                }
            });
        });
    }
    
    function startRdsCluster(dbClusterIdentifier) {
    
        return new Promise((resolve, reject) => {
    
            let params = {
                DBClusterIdentifier: dbClusterIdentifier
            };
    
            rds.startDBCluster(params, function (err, data) {
    
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    
    function stopRdsCluster(dbClusterIdentifier) {
    
        return new Promise((resolve, reject) => {
    
            let params = {
                DBClusterIdentifier: dbClusterIdentifier
            };
    
            rds.stopDBCluster(params, function (err, data) {
    
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } 
    
    exports.handler = async (event, context, callback) => {

        try {
            const action = event.action.toLowerCase();
            console.log("=== action:", action);
    
            if (action && ['start', 'stop'].indexOf(action) > -1) {
    
                let resolveOfStartStopRdsDB = await startStopRdsDB(action);
                console.log(resolveOfStartStopRdsDB);
    
            } else {
                console.log("Action was neither start nor stop. Lambda function aborted.");
            }
    
            console.log("=== Complete")
            return callback(null, "Complete");
    
        } catch (err) {
            return callback(err, null);
        }
    
    };
    