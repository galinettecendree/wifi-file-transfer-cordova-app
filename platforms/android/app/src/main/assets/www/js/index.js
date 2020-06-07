/*Partie Technique*/

//variables globales
let fichiersChoisis = null;
let httpd = null;
let boutonStopServer = null;
let msgServer = null;
let dossier = null;
let pathHttp = null;
let boutonStartExplorer = null;
let boutonStartServer = null;

let etatStory = 0;
let arrayStory = null;


let granimInstance = null;
let permissionNotif = false;

let app = {
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function () {
        dossier = LocalFileSystem.PERSISTENT;
        httpd = (cordova && cordova.plugins && cordova.plugins.CorHttpd) ? cordova.plugins.CorHttpd : null;

        setupVariable();

        cordova.plugins.notification.local.hasPermission(function (granted) {
            if(granted === false) {
                cordova.plugins.notification.local.requestPermission(function (granted) {
                    if (granted=== false) {
                        navigator.notification.alert(
                            "Merci d'accepter que cette application puisse émettre des notifications, promis elle ne vous harcèlera pas (; (au prochain lancement) !",
                            function () {
                                console.log("Problème plugin HTTP start")
                            },
                            "Attention",
                            "Ok");
                    } else  {
                        permissionNotif = true;
                    }
                });
            } else {
                permissionNotif = true;
            }
        });
        setupStory();

        console.log(cordova.plugins.notification.local.getDefaults());

        boutonStartExplorer.addEventListener("click", startExplorer);

        console.log("Initilsation Effectuée !");
    }

};

app.initialize();

function setupStory() {
    let divs = document.querySelectorAll(".story");
    arrayStory = [];
    console.log("etatStory", etatStory);
    for (const element of divs) {
        //récupération du numéro de la div
        let numDiv = parseInt(element.id.split("_")[1]);
        console.log("numéro de div", numDiv);

        //on le cache si il ne doit pas apparaitre
        if (numDiv === etatStory) {
            element.classList.remove("hideRight");
        }

        //on le met à la bonne position dans arrayStory
        arrayStory.push(element);
    }
}

function setStoryPart(number) {
    console.log("Go to the" + number + " part");
    let oldPart = arrayStory[etatStory];
    oldPart.classList.add("hideLeft");
    arrayStory[number].classList.remove("hideRight");

    if(number === 0) {
        for (let i = 0 ; i < arrayStory.length ; i++) {
            arrayStory[i].classList.remove("hideLeft");
            if(i !== 0) {
                arrayStory[i].classList.add("hideRight");
            }
        }
        arrayStory[0].classList.remove("hideRight");
    }
    etatStory = number;
}


function setupVariable() {

    boutonStartServer = document.querySelector("#startServer");
    boutonStopServer = document.querySelector("#stopServer");


    boutonStartExplorer = document.querySelector("button#fileChoose");


    msgServer = document.querySelector("#msgServer");
}


function spinTheButton (button) {
    return new Promise(function (succes, noSuccess) {
        button.classList.remove('animate');

        button.classList.add('animate');

        button.classList.add('animate');
        setTimeout(function(){
            button.classList.remove('animate');
            succes();
        },2000);
    })

}




async function startExplorer(evt) {
    if (evt!== null && evt !== undefined) {
        await spinTheButton(evt.target);
    }

    window.OurCodeWorld.Filebrowser.filePicker.single({
        success: function (data) {
            if (!data.length) {
                // En cas de non sélection de fichier
                navigator.notification.confirm(
                    'Vous n\'avez sélectionné aucun fichier !',  // message
                    function (buttonIndex) {
                        switch (buttonIndex) {
                            case 1 :
                                startExplorer();
                                break;
                            case 2:
                                stopServer();
                                break;
                        }
                    },         // callback
                    'Attention',            // title
                    ["Je me suis trompé", "C'est normal"]                 // buttonName
                );
                return;
            }

            //stockage de l'addresse du fichier
            fichiersChoisis = data[0];

            //pour récuperer le nom du dossier
            pathHttp = fichiersChoisis.split("/");
            pathHttp[pathHttp.length - 1] = "";
            pathHttp = pathHttp.join("/");

            let nomFichier = pathHttp[pathHttp.length - 1];

            //changement de partie
            setStoryPart(1);

            //attente pour démarrage serveur
            boutonStartServer.addEventListener("click", function (evt) {
                console.log("click startServer");
                startHttpServer(pathHttp, nomFichier, evt);
            });



        }, error: function (err) {
            console.log(err);
        }
    });
}


async function startHttpServer(path, nomFichier, evt) {
    await spinTheButton(evt.target);
    if (httpd) {
        //vérifie si il y en a deja un de lancé
        httpd.getURL(function (url) {

            //adaptation du path pour qu'il match avec le type d'url demandé par le serveur
            path = path.replace('file://', '');

            if (url.length > 0) {
                //si déjà lancé
                httpd.getLocalPath(function (localPath) {

                    if (localPath !== path) {
                        //si le chemin a changé, arrete le serveur et en relance un au bon emplacement
                        stopServer();
                        httpd.startServer({
                            'www_root': path,
                            'port': 8080,
                            'localhost_only': false
                        }, function (url) {
                            navigator.notification.alert(
                                "Le serveur a bien été mis à jour !",
                                function () {/*DO NOTHING*/
                                },
                                "Information",
                                "Ok");

                            boutonStopServer.style.display = "initial";

                            boutonStopServer.addEventListener("click", function (evt) {
                                stopServer(evt);
                            });

                        }, function (error) {
                            navigator.notification.alert(
                                "Il y a eu un problème dans la mise à jour du serveur, merci de recommencer (Erreur : " + error + " !",
                                function () {/*DO NOTHING*/
                                },
                                "Alerte",
                                "Ok");
                        });
                    }
                });
                makeUrlShort(url + "/" + nomFichier).then((result) => {
                    msgServer.innerHTML = "Url du fichier :</br><a href=\'" + result + "\' target='_blank'>" + result + "</a>";
                }).catch(() => {
                    msgServer.innerHTML = "Url du fichier :</br><a href=\'" + url + "/" + nomFichier + "\' target='_blank'>" + url + "/" + nomFichier + "</a>";
                })
                setStoryPart(2);
            } else {

                //sinon
                setStoryPart(2);
                httpd.startServer({
                    'www_root': path,
                    'port': 8080,
                    'localhost_only': false
                }, function (url) {
                    // if server is up, it will return the url of http://<server ip>:port/
                    // the ip is the active network connection
                    // if no wifi or no cell, "127.0.0.1" will be returned.
                    makeUrlShort(url + "/" + nomFichier).then((result) => {
                        msgServer.innerHTML = "Url du fichier :</br><a href=\'" + result + "\' target='_blank'>" + result + "</a>";
                    }).catch(() => {
                        msgServer.innerHTML = "Url du fichier :</br><a href=\'" + url + "/" + nomFichier + "\' target='_blank'>" + url + "/" + nomFichier + "</a>";
                    });

                    setServerNotification(url + "/" + nomFichier);

                    httpd.getLocalPath(function (path) {
                        console.log("Server local path", path);
                    });

                    boutonStopServer.addEventListener("click", function (evt) {
                        stopServer(evt);
                    });

                    boutonStartExplorer.innerHTML = "Choisir un autre fichier";

                }, function (error) {
                    msgServer.innerHTML = "Problème au lancement serveur \n Erreur :" + error;
                });
            }

        })
    } else {
        navigator.notification.alert(
            "Il y a eu un problème avec un composant de l'application (HTTP), redémarrez-la et si le problème persiste contactez le développeur !",
            function () {
                console.log("Problème plugin HTTP start")
            },
            "Alerte",
            "Ok");
    }
}


async function stopServer(evt) {
    if (evt!== null && evt !== undefined) {
        await spinTheButton(evt.target);
    }

    if (httpd) {
        // call this API to stop web server
        httpd.stopServer(function () {
            navigator.notification.alert(
                "Le partage a bien été stoppé !",
                function () {
                    setStoryPart(0);
                    return;
                },
                "Information",
                "Ok");


        }, function (error) {
            msgServer.innerHTML = 'Le serveur n\' a pas pu être arreté \n Erreur :' + error;
        });
    } else {
        navigator.notification.alert(
            "Il y a eu un problème avec un composant de l'application (HTTP), redémarrez-la et si le problème persiste contactez le développeur !",
            function () {
                console.log("Problème plugin HTTP stop")
            },
            "Alerte",
            "Ok");
    }
}

function makeUrlShort(url) {
    return new Promise(function (resolve, reject) {
        let headers = new Headers();
        headers.append('content-type', "application/json");
        headers.append('apikey', "013d01c1dab14620bd9aef4fad15a1c3");

        fetch('https://api.rebrandly.com/v1/links', {
            method: 'post',
            headers: headers,
            body: JSON.stringify({destination: url})
        }).then(res => res.json())
            .then(res => {
                return resolve(res.shortUrl)
            }).catch((error) => {
            reject(error)
        });
    })

}

function setServerNotification (url) {
    if(permissionNotif) {
        cordova.plugins.notification.local.schedule({
            title: 'Partage en cours',
            text: 'Votre partage est toujours en cours !\nUrl : '+url,
            foreground: true,
            launch:true,
            lockscreen:true,
            actions: [
                { id: 'stop', title: 'Arrêter le partage' }
            ]
        });

        cordova.plugins.notification.local.on("stop", function () {
            stopServer();
        });
    } else {
        return false;
    }
}

