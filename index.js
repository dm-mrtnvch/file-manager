import readline from 'readline'
import os from 'os'

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const getUsername = () => {
  const usernameArg = process.argv.find(arg => arg.startsWith('--username'))
  const usernameValue = usernameArg.split('=')[1]
  return usernameValue || 'John Doe'
}

const getGreeting = () => {
  console.log(`Welcome to the File Manager, ${getUsername()}`)
}

const getWorkingDirectory = () => {
  const currentDirectory = process.cwd()
  console.log(`You are currently in ${currentDirectory}`)
}

const setUserHomeAsWorkingDirectory = () => {
  const startingWorkingDirectory = os.homedir()
  process.chdir(startingWorkingDirectory)
}

readlineInterface.on('line', (input) => {
  if(input === '.exit') {
    console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
    process.exit(0)
  }
})

readlineInterface.on('close', () => {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
})

setUserHomeAsWorkingDirectory()
getGreeting()
getWorkingDirectory()
