import os, { homedir } from "os"
import readline from "readline"
import path, {resolve, format, dirname, basename, join} from 'path'
import fs from 'fs/promises'
import { cwd } from 'process'
import { createReadStream, createWriteStream } from 'fs'
import { createHash } from 'crypto'
import { createBrotliCompress, createBrotliDecompress } from 'zlib'
import { pipeline } from 'stream/promises'


const homeDirectory = homedir()
let user = process.argv.find(function(arg) { return arg.startsWith('--username=') })?.split('=')[1] || 'Anonymous'
if (user === 'Anonymous') {
  console.log('Username was not provided, defaulting to Anonymous')
}

process.chdir(homeDirectory)

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function up() {
  const currentDir = process.cwd()
  const parentDir = path.parse(currentDir).root === currentDir ? currentDir : path.join(currentDir, "..")
  process.chdir(parentDir)
  showCurrentDirectory()
}

function showCurrentDirectory() {
  console.log(`You are currently in ${process.cwd()}`)
}

const commands = {
  up: up,
  cd: cd,
  ls: ls,
  cat: displayFileContent,
  add: createEmptyFile,
  rn: renameFile,
  cp: copyFile,
  mv: moveFile,
  rm: deleteFile,
  os: systemInfo,
  hash: hashFile,
  compress: compressFile,
  decompress: decompressFile
}

console.log(`Welcome to the File Manager, ${user}!`)
showCurrentDirectory()

cli.on('line', function(input) {
  const [command, ...args] = input.trim().split(/\s+/)
  if (command === '.exit') {
    console.log(`Thank you for using File Manager, ${user}, goodbye!`)
    cli.close()
  } else if (commands[command]) {
    commands[command](...args)
  } else {
    console.log(`Invalid command: ${command}`)
    showCurrentDirectory()
  }
})

async function ls() {
  try {
    const entries = await fs.readdir(cwd(), { withFileTypes: true })
    const folders = entries.filter(entry => entry.isDirectory()).map(dir => ({ Name: dir.name, Type: 'Directory' }))
    const files = entries.filter(entry => entry.isFile()).map(file => ({ Name: file.name, Type: 'File' }))
    const links = entries.filter(entry => entry.isSymbolicLink()).map(link => ({ Name: link.name, Type: 'Symbolic Link' }))

    const sortedFolders = folders.sort((a, b) => a.Name.localeCompare(b.Name))
    const sortedFiles = files.sort((a, b) => a.Name.localeCompare(b.Name))
    const sortedLinks = links.sort((a, b) => a.Name.localeCompare(b.Name))

    const combinedList = [...sortedFolders, ...sortedFiles, ...sortedLinks]
    if (combinedList.length === 0) {
      console.log('Directory is empty')
    } else {
      console.table(combinedList)
    }
  } catch {
    console.log('Failed to list directory contents')
  }
}

function displayFileContent(filePath) {
  const fullPath = resolve(process.cwd(), filePath)
  const stream = createReadStream(fullPath)

  stream.on('open', () => {
    stream.pipe(process.stdout)
  })

  stream.on('error', (error) => {
    if (error.code === 'ENOENT') {
      console.log('File does not exist')
    } else {
      console.log('Error reading file')
    }
  })
}

async function moveFile(sourcePath, destinationDir) {
  if (typeof sourcePath !== 'string' || typeof destinationDir !== 'string') {
    console.log("Error: Both source path and destination directory must be provided as strings.")
    return
  }
  const resolvedSourcePath = resolve(process.cwd(), sourcePath)
  const resolvedDestinationDir = resolve(process.cwd(), destinationDir)
  const destinationPath = join(resolvedDestinationDir, basename(sourcePath))

  try {
    const sourceStats = await fs.stat(resolvedSourcePath)
    if (!sourceStats.isFile()) {
      console.log("The source is not a file.")
      return
    }

    try {
      const destinationStats = await fs.stat(resolvedDestinationDir)
      if (!destinationStats.isDirectory()) {
        console.log("The destination is not a directory.")
        return
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log("The destination directory does not exist.")
        return
      }
      throw error
    }

    const readable = createReadStream(resolvedSourcePath)
    const writable = createWriteStream(destinationPath)

    readable.pipe(writable).on('finish', async () => {
      try {
        await fs.unlink(resolvedSourcePath)
        console.log(`${basename(sourcePath)} has been moved to ${destinationDir}`)
      } catch (error) {
        console.log("Failed to delete the original file.")
      }
    })

    readable.on('error', () => console.log("Failed to read the source file."))
    writable.on('error', () => console.log("Failed to write to the destination file."))

  } catch (error) {
    console.log("An error occurred: " + error.message)
  }
}

async function compressFile(inputPath, outputPath) {
  if (!inputPath || !outputPath) {
    console.log("Error: Both source and destination paths must be provided.")
    return
  }
  const sourcePath = resolve(process.cwd(), inputPath)
  const destinationPath = resolve(process.cwd(), outputPath)
  const sourceStream = createReadStream(sourcePath)
  const destinationStream = createWriteStream(destinationPath)
  const compressStream = createBrotliCompress()

  try {
    await pipeline(
      sourceStream,
      compressStream,
      destinationStream
    )
    console.log(`File has been compressed and saved to: ${outputPath}`)
  } catch (error) {
    console.error('Compression failed:', error)
  }
}

async function decompressFile(inputPath, outputPath) {
  const resolvedInputPath = resolve(process.cwd(), inputPath)
  const resolvedOutputPath = resolve(outputPath)
  const sourceStream = createReadStream(resolvedInputPath)
  const destinationStream = createWriteStream(resolvedOutputPath)
  const decompressStream = createBrotliDecompress()

  try {
    await pipeline(
      sourceStream,
      decompressStream,
      destinationStream
    )
    console.log(`File has been decompressed and saved to: ${resolvedOutputPath}`)
  } catch (error) {
    console.error('Decompression failed:', error)
  }
}

async function createEmptyFile(fileName) {
  const fullPath = resolve(process.cwd(), fileName)
  try {
    await fs.writeFile(fullPath, '')
    console.log(`${fileName} file has been created`)
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.log('Cannot create the file: it already exists')
    } else {
      console.log('Failed to create the file')
    }
  }
}

async function deleteFile(filePath) {
  const fullPath = resolve(process.cwd(), filePath)
  try {
    await fs.access(fullPath)
    await fs.unlink(fullPath)
    console.log(`${filePath} has been deleted`)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('File does not exist')
    } else {
      console.log('Failed to delete the file')
    }
  }
}

async function calculateFileHash(filePath) {
  const fullPath = resolve(process.cwd(), filePath)
  const hash = createHash('sha256')
  const stream = createReadStream(fullPath)

  return new Promise((resolve, reject) => {
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

async function hashFile(filePath) {
  try {
    const hashValue = await calculateFileHash(filePath)
    console.log(`Hash for ${filePath} is ${hashValue}`)
  } catch (error) {
    console.log(`Failed to calculate hash for ${filePath}`)
  }
}

function systemInfo(argument) {
  switch (argument) {
    case '--EOL':
      console.log(`End-of-Line marker: ${JSON.stringify(os.EOL)}`)
      break
    case '--cpus':
      const cpuInfo = os.cpus()
      console.log(`Total CPUs: ${cpuInfo.length}`)
      cpuInfo.forEach((cpu, index) => {
        console.log(`CPU #${index + 1}: Model=${cpu.model}, Speed=${cpu.speed / 1000} GHz`)
      })
      break
    case '--homedir':
      console.log(`Home Directory: ${os.homedir()}`)
      break
    case '--username':
      console.log(`Username: ${os.userInfo().username}`)
      break
    case '--architecture':
      console.log(`Architecture: ${os.arch()}`)
      break
    default:
      console.log('Invalid argument. Use one of --EOL, --cpus, --homedir, --username, --architecture')
  }
}


async function copyFile(sourcePath, destinationDir) {
  if (typeof sourcePath !== 'string' || typeof destinationDir !== 'string') {
    console.log("Error: Both source path and destination directory must be provided as strings.")
    return
  }
  const resolvedSourcePath = resolve(process.cwd(), sourcePath)
  const resolvedDestinationDir = resolve(process.cwd(), destinationDir)
  const destinationPath = join(resolvedDestinationDir, basename(sourcePath))

  try {
    const sourceStats = await fs.stat(resolvedSourcePath)
    if (!sourceStats.isFile()) {
      console.log("The source is not a file.")
      return
    }

    const destinationStats = await fs.stat(resolvedDestinationDir)
    if (!destinationStats.isDirectory()) {
      console.log("The destination is not a directory.")
      return
    }

    const readable = createReadStream(resolvedSourcePath)
    const writable = createWriteStream(destinationPath)
    readable.pipe(writable)

    readable.on('error', () => console.log("Failed to read the source file."))
    writable.on('error', () => console.log("Failed to write to the destination file."))
    writable.on('close', () => console.log(`${basename(sourcePath)} has been copied to ${destinationDir}`))
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log("Source file or destination directory does not exist.")
    } else {
      console.log("An error occurred.")
    }
  }
}

async function renameFile(oldPath, newName) {
  const sourcePath = resolve(process.cwd(), oldPath)
  const destinationPath = join(dirname(sourcePath), newName)

  try {
    await fs.rename(sourcePath, destinationPath)
    console.log(`${basename(oldPath)} has been renamed to ${newName}`)
  } catch (error) {
    console.log('Failed to rename the file. Make sure the file exists and the new name is valid.')
  }
}

function cd(directory) {
  const targetDirectory = resolve(process.cwd(), directory)
  try {
    process.chdir(targetDirectory)
    console.log(`Now in ${process.cwd()}`)
  } catch {
    console.log(`Failed to change directory to ${directory}`)
  }
}

cli.on('SIGINT', function() {
  console.log(`Thank you for using File Manager, ${user}, goodbye!`)
  cli.close()
})

