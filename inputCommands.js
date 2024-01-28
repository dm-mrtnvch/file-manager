import {getCurrentDirectory, getUsername} from './index.js'
import os from 'os'
import path from 'path'

const exit = () => {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
  process.exit(0)
}

const up = (directory) => {
  const currentDirectory = process.cwd()
  const rootDirectory = os.homedir()

  if (directory === 'up' && !currentDirectory.startsWith(rootDirectory)) {
    process.chdir('..')
    console.log(currentDirectory)
  } else {
    console.log(currentDirectory)
  }
}

const cd = (directory) => {
  const currentDirectory = process.cwd()
  const rootDirectory = os.homedir()

  if (directory.startsWith('./')) {
    const targetDirectory = path.resolve(currentDirectory, directory)

    if (targetDirectory.startsWith(rootDirectory)) {
      try {
        process.chdir(targetDirectory)
        getCurrentDirectory()
      } catch (e) {
        getInvalidInput()
      }
    }
  }
}

export const inputCommands = {
  '.exit': exit,
  'up': up,
}

const getInvalidInput = () => {
  console.log('Invalid input')
}

export const inputCommandsHandler = (input) => {
  if (input.startsWith('cd ')) {
    const directory = input.slice(3)
    cd(directory)
  } else if (inputCommands.hasOwnProperty(input)) {
    inputCommands[input]()
  } else {
    getInvalidInput()
  }
}
