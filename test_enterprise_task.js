// Test Enterprise Task Complexity
import { CognitiveRouter } from './dist/tools/cognitiveRouter.js';

const router = new CognitiveRouter();

const enterpriseTask = {
  id: 'test-3',
  name: 'Enterprise-Wide System Architecture Overhaul',
  description: 'This extremely complex task requires comprehensive system architecture redesign involving multiple microservices, temporal knowledge graphs, episodic memory management, multi-agent coordination patterns, complex dependency resolution, distributed transaction management, real-time data synchronization, machine learning model integration, security compliance frameworks, performance optimization across multiple systems, and extensive documentation of historical context and decision-making processes. The implementation must consider temporal dependencies, maintain episodic memory of all architectural decisions, coordinate between multiple autonomous systems, and ensure backward compatibility while implementing forward-looking design patterns.',
  notes: 'Enterprise-grade complexity with multiple stakeholder coordination',
  dependencies: [
    {taskId: 'dep1'}, {taskId: 'dep2'}, {taskId: 'dep3'}, 
    {taskId: 'dep4'}, {taskId: 'dep5'}, {taskId: 'dep6'}
  ],
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('🚀 Testing Enterprise Task');
const assessment = router.assessTaskComplexity(enterpriseTask);
console.log(`- Description Length: ${enterpriseTask.description.length} chars`);
console.log(`- Dependencies: ${enterpriseTask.dependencies.length}`);
console.log(`- Complexity Score: ${assessment.complexityScore}`);
console.log(`- Complexity Level: ${assessment.level}`);
console.log(`- System Recommendation: ${assessment.systemRecommendation}`);
console.log(`- MCP Server Target: ${assessment.mcpServerTarget}`);
console.log(`- Episodic Memory Required: ${assessment.episodicMemoryRequired}`);
console.log(`- Temporal Context Required: ${assessment.temporalContextRequired}`);