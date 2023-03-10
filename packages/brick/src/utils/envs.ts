import dotenv from 'dotenv-defaults'
dotenv.config()
export const config = process.env

function main() {
  let envs = ''
  Object.entries(process.env).forEach((value) => {
    envs += value[0] + '="' + value[1] + '"\n'
  })
  envs = envs.slice(0, envs.length - 1)
  return envs
}

main()