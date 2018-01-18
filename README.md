<img align="right" src="https://raw.githubusercontent.com/PancakeDB/PancakeDB/master/PancakeDB.png" width="300" height="300">

# PancakeDB [![CircleCI](https://circleci.com/gh/PancakeDB/PancakeDB/tree/master.svg?style=svg)](https://circleci.com/gh/PancakeDB/PancakeDB/tree/master)
PancakeDB (sometimes called Pancake) is a database system written in Node.js, and uses websockets for communicating with a client.

# Configuration
The default PancakeDB configuration looks like this:

```ini
[Configuration]
Port=8080
Password=
```

You can configure the port by changing the `Port` option. To set a password, however, is a little bit different. You need to run the command `node password` in the PancakeDB install folder to change the password. It will prompt you to input a password. Simply type in your desired password, and press Enter. It will set it in the configuration automatically.