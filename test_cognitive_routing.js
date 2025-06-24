// Test Script for Cognitive Routing Algorithm
import { CognitiveRouter } from './dist/tools/cognitiveRouter.js';

const router = new CognitiveRouter();

// Test Task 1: Simple Task
const simpleTask = {
  id: 'test-1',
  name: 'Simple Test Task',
  description: 'A basic task for testing cognitive routing',
  notes: 'This should route to System 1 (Supabase MCP)',
  dependencies: [],
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Test Task 2: Complex Task  
const complexTask = {
  id: 'test-2',
  name: 'Complex System Integration Task',
  description: 'This is a very complex task that involves multiple systems, requires extensive analysis, temporal knowledge management, and sophisticated coordination between different architectural components. It includes multiple dependencies, requires episodic memory storage, and involves complex reasoning patterns that exceed simple database operations.',
  notes: 'Additional notes about temporal context and knowledge management requirements',
  dependencies: [],
  status: 'pending', 
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('🧪 Testing Cognitive Routing Algorithm\n');

console.log('📊 Test 1: Simple Task');
const assessment1 = router.assessTaskComplexity(simpleTask);
console.log(`- Description Length: ${simpleTask.description.length} chars`);
console.log(`- Complexity Score: ${assessment1.complexityScore}`);
console.log(`- Complexity Level: ${assessment1.level}`);
console.log(`- System Recommendation: ${assessment1.systemRecommendation}`);
console.log(`- MCP Server Target: ${assessment1.mcpServerTarget}\n`);

console.log('📊 Test 2: Complex Task');
const assessment2 = router.assessTaskComplexity(complexTask);
console.log(`- Description Length: ${complexTask.description.length} chars`);
console.log(`- Complexity Score: ${assessment2.complexityScore}`);
console.log(`- Complexity Level: ${assessment2.level}`);
console.log(`- System Recommendation: ${assessment2.systemRecommendation}`);
console.log(`- MCP Server Target: ${assessment2.mcpServerTarget}`);
console.log(`- Episodic Memory Required: ${assessment2.episodicMemoryRequired}`);
console.log(`- Temporal Context Required: ${assessment2.temporalContextRequired}\n`);

console.log('✅ Test completed!');