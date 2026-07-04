import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'

const VAULT_DIR = process.env.VAULT_DIR_OVERRIDE ?? path.resolve(process.cwd(), '../vault')
const FOLDERS = ['notes', 'tasks', 'experiments', 'references', 'milestones', 'sessions']

async function main() {
  const forced = process.argv.includes('--yes')

  console.log(`Vault: ${VAULT_DIR}`)
  console.log('Thao tác này sẽ xoá toàn bộ file trong:')
  for (const folder of FOLDERS) console.log(`  - vault/${folder}/`)
  console.log('và reset vault/current-direction.md về rỗng.')
  console.log('(Vault đang được git track nên vẫn khôi phục được qua git nếu lỡ tay.)')
  console.log('')

  if (!forced) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question('Gõ "yes" để xác nhận: ')
    rl.close()
    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Đã huỷ, không có gì bị xoá.')
      return
    }
  }

  let deletedCount = 0
  for (const folder of FOLDERS) {
    const dir = path.join(VAULT_DIR, folder)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue
      fs.unlinkSync(path.join(dir, f))
      deletedCount++
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(
    path.join(VAULT_DIR, 'current-direction.md'),
    `---\nupdated: ${today}\n---\n\n## Current hypothesis\n\n\n## Changelog\n\n`,
  )

  console.log(`Đã xoá ${deletedCount} file. Vault giờ trống, sẵn sàng bắt đầu workspace mới.`)
}

main()
