import type { DeployContract } from '../types.js';

export async function provisionEnvironment(input: { contract: DeployContract; mode: string; testRunId: string }): Promise<void> {
  if (input.mode === 'dry-run') {
    console.log('[dry-run] resolve environment plan');
    console.log(`- app: ${input.contract.app.name}`);
    console.log(`- deploy: ${input.contract.deploy.type}`);
    console.log(`- health: ${input.contract.healthCheck.url}`);
    return;
  }

  console.log('[execute] environment provisioning is intentionally delegated to deploy Skill.');
  console.log('Example: helm upgrade --install diffguard ./deploy/chart --namespace ai-test-pr-xxx --create-namespace');
}
