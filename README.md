# DAI-2022-UDP-Orchestra
## Par Guillaume Courbat et Thomas Germano

## Admin

- **You can work in groups of 2 students**.
- It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**.
- We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Teams, so that everyone in the class can benefit from the discussion.
- ⚠️ You will have to send your GitHub URL, answer the questions and send the output log of the `validate.sh` script, which prove that your project is working [in this Google Form](https://forms.gle/6SM7cu4cYhNsRvqX8).

## Objectives

This lab has 4 objectives:

- The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

- The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

- The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

- Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.

## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

- the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

- the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)

### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound       |
| ---------- | ----------- |
| `piano`    | `ti-ta-ti`  |
| `trumpet`  | `pouet`     |
| `flute`    | `trulu`     |
| `violin`   | `gzi-gzi`   |
| `drum`     | `boum-boum` |

### TCP-based protocol to be implemented by the Auditor application

- The auditor should include a TCP server and accept connection requests on port 2205.
- After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab

You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 dai/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d dai/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d dai/musician piano
$ docker run -d dai/musician flute
$ docker run -d dai/musician flute
$ docker run -d dai/musician drum
```

When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.

# Tasks and questions

Reminder: answer the following questions [here](https://forms.gle/6SM7cu4cYhNsRvqX8).

## Task 1: design the application architecture and protocols

| #        | Topic                                                                                                                                                                                                                                                                                                                     |
| -------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands?                                                                                                                                                   |
|          | ![image](images/diagram.png)                                                                                                                                                                                                                                                                                              |
| Question | Who is going to **send UDP datagrams** and **when**?                                                                                                                                                                                                                                                                      |
|          | The musicians are going to send the UDP datagrams                                                                                                                                                                                                                                                                         |
| Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received?                                                                                                                                                                                                                          |
|          | It is the auditor who will listen for UDP datagrams, the list of active musicians will be updated in consequences                                                                                                                                                                                                         |
| Question | What **payload** should we put in the UDP datagrams?                                                                                                                                                                                                                                                                      |
|          | The following payload need to be in the UDP datagrams :<br/>- uuid<br/> - the soud emitted<br/>                                                                                                                                                                                                                           |
| Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures?                                                                                                                                                                  |
|          | An object generated once and serialized in JSON is send every second as an UDP datagram payload by the musicians. Auditor has a list of active musician updated after each UDP datagram received. When someone ask to the auditor the list of active musician, he will return the list under JSON via the TCP connection. |

## Task 2: implement a "musician" Node.js application

| #        | Topic                                                                                                                                                                                          |
| -------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**?                                                                                                            |
|          | ```JSON.stringify(obj)```                                                                                                                                                                      |
| Question | What is **npm**?                                                                                                                                                                               |
|          | npm (short for Node Package Manager) is a package manager for the JavaScript programming language. It is the default package manager for the JavaScript runtime environment Node.js.           |
| Question | What is the `npm install` command and what is the purpose of the `--save` flag?                                                                                                                |
|          | - the `npm install` install the specified package into the current working directories<br/>- The `--save` flag is used to add the package as a dependency to your project's package.json file. |
| Question | How can we use the `https://www.npmjs.com/` web site?                                                                                                                                          |
|          | The npm website, https://www.npmjs.com/, is a resource for discovering and managing JavaScript packages.                                                                                       |
| Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122?                                                                                                                          |
|          | We can use the node.js package `uuuid` used for this lab.<br/>First, create the variable containing the uuid module<br/>Then generate a random uuid with `uuid.v4()`                           |
| Question | In Node.js, how can we execute a function on a **periodic** basis?                                                                                                                             |
|          | using the following syntax : `setInterval(function_name, time_interval)`                                                                                                                       |
| Question | In Node.js, how can we **emit UDP datagrams**?                                                                                                                                                 |
|          | Using the npm package **dgram**, creating an UDP socket then use the `send()` method to send package                                                                                           |
| Question | In Node.js, how can we **access the command line arguments**?                                                                                                                                  |
|          | With the process variable, here is an example : `let example = process.argv[arg_index]`                                                                                                        |

## Task 3: package the "musician" app in a Docker image

| #        | Topic                                                                                                                                                                                                                                                                                                    |
| -------- |----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | What is the purpose of the `ENTRYPOINT` statement in our Dockerfile?                                                                                                                                                                                                                                     |
|          | In a Dockerfile, the ENTRYPOINT instruction is used to configure the command that will be run when a container is started from the image. It specifies the command that should be run when the container is started, and any command line arguments passed to docker run will be passed to this command. |
| Question | How can we check that our running containers are effectively sending UDP datagrams?                                                                                                                                                                                                                      |
|          | Use tcpdump command: You can use the tcpdump command to capture the network traffic on the host machine, and then filter the output to show only UDP traffic. like that :<br/>`sudo tcpdump -i any -n udp`                                                                                               |

## Task 4: implement an "auditor" Node.js application

| #        | Topic                                                                                                                                                                                                                                                                        |
| -------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Question | With Node.js, how can we listen for UDP datagrams in a multicast group?                                                                                                                                                                                                      |
|          | In Node.js, you can use the dgram module to listen for UDP datagrams in a multicast group.<br/>First creat a udp socket with dgram `const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });`<br/>then rejoin the group group with the method `addMembership()` |
| Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?                                                                                                                                                                           |
|          | first, initialized a dictionnary `const dictionary = new Map();`<br/>then add an entry like that `dictionary.set('apple', 'a round fruit that is red or green');` and *voilà*                                                                                                |
| Question | When and how do we **get rid of inactive players**?                                                                                                                                                                                                                          |
|          | Each time we received a datagram from a musician, we update his entry in the list in setting the activeSince with the current timestamp, if a activeSince is older than 5 seconds, the musician is removed from the list.                                                    |
| Question | How do I implement a **simple TCP server** in Node.js?                                                                                                                                                                                                                       |
|          | Using the net package and his `createServer` method                                                                                                                                                                                                                          |

## Task 5: package the "auditor" app in a Docker image

| #        | Topic                                                                       |
| -------- |-----------------------------------------------------------------------------|
| Question | Send us the log file of the validation script to show that everything is ok |
|          | ok                                                                          |

## Constraints

Please be careful to adhere to the specifications in this document, and in particular

- the Docker image names
- the names of instruments and their sounds
- the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

### Validation

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should **try to run it** to see if your implementation is correct. When you submit your project in the [Google Form](https://forms.gle/6SM7cu4cYhNsRvqX8), the script will be used for grading, together with other criteria.
