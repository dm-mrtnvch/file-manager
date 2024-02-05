import {getCurrentDirectory, getUsername} from './index.js'
import { createReadStream } from 'fs'
import os from 'os'
import path from 'path'
import fs from 'fs'

function exit() {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
  process.exit(0)
}

function up(directory) {
  const currentDirectory = process.cwd()
  const rootDirectory = os.homedir()

  if (directory === 'up' && !currentDirectory.startsWith(rootDirectory)) {
    process.chdir('..')
    console.log(currentDirectory)
  } else {
    console.log(currentDirectory)
  }
}

function cd(directory) {
  const currentDirectory = process.cwd()
  const rootDirectory = os.homedir()

  if (directory.startsWith('./') || path.isAbsolute(directory)) {
    const targetDirectory = path.resolve(currentDirectory, directory)

    if (targetDirectory.startsWith(rootDirectory)) {
      try {
        process.chdir(targetDirectory)
        getCurrentDirectory()
      } catch (e) {
        getInvalidInput()
      }
    } else {
      getInvalidInput()
    }
  } else {
    getInvalidInput()
  }
}

export const inputCommands = {
  '.exit': exit,
  'up': up,
  'ls': list
}

function getInvalidInput() {
  console.log('Invalid input')
}

export const inputCommandsHandler = function(input) {
  const args = input.trim().split(/\s+/)
  const command = args[0]

  if (command === 'cd') {
    if (args[1]) {
      cd(args[1])
    } else {
      getInvalidInput()
    }
  } else if (command === 'cat') {
    if (args[1]) {
      cat(args[1])
    } else {
      getInvalidInput()
    }
  } else if (inputCommands.hasOwnProperty(command)) {
    inputCommands[command]()
  } else {
    getInvalidInput()
  }
}

function list ()  {
  const currentDirectory = process.cwd()
  fs.readdir(currentDirectory, { withFileTypes: true }, (err, items) => {
    if (err) {
      console.log('Error reading directory')
      return
    }

    const sortedItems = items
      .map(item => ({
        Name: item.name,
        Type: item.isDirectory() ? 'directory' : 'file'
      }))
      .sort((a, b) => {
        if (a.Type === b.Type) {
          return a.Name.localeCompare(b.Name)
        }
        return a.Type === 'directory' ? -1 : 1
      })

    console.table(sortedItems)
  })
}

function cat(filePath) {
  const fullFilePath = path.resolve(process.cwd(), filePath)

  if (!fullFilePath.startsWith(os.homedir())) {
    console.log("Access denied: You can only access files within your home directory.")
    return
  }

  const readStream = createReadStream(fullFilePath, 'utf8')

  readStream.on('data', function(chunk) {
    console.log(chunk)
  })

  readStream.on('error', function(err) {
    console.log('Error reading file:', err.message)
  })

  readStream.on('end', function() {
    console.log('End of file reached.')
  })
}
