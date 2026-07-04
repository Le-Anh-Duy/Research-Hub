import readline from 'node:readline/promises'
import { applyOnboarding, isVaultFresh } from '../server/vault.ts'

async function main() {
  if (!isVaultFresh()) {
    console.log('Vault này có vẻ đã có nội dung rồi (đã có task/experiment/note/milestone).')
    console.log('Onboarding chỉ dành cho vault trống. Nếu muốn làm lại từ đầu, chạy: npm run vault:reset')
    return
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log('Chào bạn! Vài câu hỏi nhanh để khởi tạo research hub.\n')

  const projectName = await rl.question('Tên project nghiên cứu: ')
  const hypothesis = await rl.question('Hướng nghiên cứu / giả thuyết ban đầu (1-2 câu): ')
  const milestoneTitle = await rl.question('Mốc đầu tiên muốn đạt (Enter để bỏ qua): ')
  const taskTitle = await rl.question('Việc đầu tiên cần làm ngay (Enter để bỏ qua): ')

  rl.close()

  if (!projectName.trim() || !hypothesis.trim()) {
    console.log('\nCần ít nhất tên project và hướng nghiên cứu. Đã huỷ, chạy lại script khi sẵn sàng.')
    return
  }

  const result = applyOnboarding({
    projectName: projectName.trim(),
    hypothesis: hypothesis.trim(),
    milestoneTitle: milestoneTitle.trim() || undefined,
    taskTitle: taskTitle.trim() || undefined,
  })

  console.log('\nĐã khởi tạo:')
  console.log('  - vault/current-direction.md')
  if (result.milestone) console.log(`  - vault/${result.milestone.path}`)
  if (result.task) console.log(`  - vault/${result.task.path}`)
  console.log('\nChạy "npm run dev" để mở dashboard.')
}

main()
