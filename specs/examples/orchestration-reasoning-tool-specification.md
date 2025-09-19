# Orchestration Reasoning Tool Specification

## Overview

The `orchestration_reasoning` MCP tool enables models to dynamically design custom retrieval orchestrations by combining the four core primitives (querying, filtering, aggregation, reasoning) like Lego blocks. This tool provides structured reasoning capabilities for orchestration planning, allowing models to analyze information needs and construct optimal primitive sequences.

## Design Philosophy

- **Composable Architecture**: Primitives serve as building blocks for dynamic orchestration design
- **Structured Reasoning**: Sequential thought process guides orchestration planning decisions
- **Reference-Driven**: Existing orchestrations provide patterns and inspiration for new designs
- **Adaptive Planning**: Orchestration design adapts to specific information requirements and constraints
- **Testable Design**: Each orchestration plan includes validation anchors for testing and verification

---

## Tool Definition

### MCP Tool Registration

```typescript
server.tool(
  'orchestration_reasoning',
  'Design custom retrieval orchestrations by combining primitives with structured reasoning',
  {
    information_need: z.string().describe('Description of the information requirement to fulfill'),
    context: z.object({
      domain: z.string().describe('Domain or subject area (e.g., "business-intelligence", "academic-research")'),
      complexity: z.enum(['low', 'medium', 'high']).describe('Expected complexity level'),
      time_constraint: z.string().optional().describe('Time constraints for execution'),
      quality_requirements: z.string().optional().describe('Quality and accuracy requirements'),
      available_tools: z.array(z.string()).optional().describe('Available MCP tools for execution')
    }).describe('Context and constraints for orchestration design'),
    reasoning_depth: z.enum(['surface', 'moderate', 'deep']).default('moderate').describe('Depth of reasoning analysis'),
    reference_patterns: z.boolean().default(true).describe('Whether to analyze existing orchestration patterns'),
    agentic_level: z.enum(['prescriptive', 'guided', 'autonomous']).default('guided').describe('Agentic level for primitive execution')
  },
  async (args) => {
    // Implementation details follow
  }
);
```

### Parameters

#### Required Parameters

- **information_need** (string): Clear description of what information is needed and why
- **context** (object): Contextual information including:
  - **domain** (string): Subject area or domain
  - **complexity** (enum): Expected complexity level
  - **time_constraint** (string, optional): Time limitations
  - **quality_requirements** (string, optional): Quality expectations
  - **available_tools** (array, optional): Available MCP tools

#### Optional Parameters

- **reasoning_depth** (enum): Level of analysis depth ['surface', 'moderate', 'deep']
- **reference_patterns** (boolean): Whether to analyze existing orchestrations
- **agentic_level** (enum): Execution autonomy level for primitives

---

## Structured Reasoning Process

The tool follows a sequential reasoning pattern similar to [`examples/sequential-thinking.ts`](examples/sequential-thinking.ts:1) but focused on orchestration design:

### Phase 1: Information Need Analysis
```
// TEST: Should accurately parse information requirements
// TEST: Should identify key information dimensions
// TEST: Should classify complexity appropriately
```

**Reasoning Steps:**
1. **Need Decomposition**: Break down complex information needs into components
2. **Information Type Classification**: Identify types of information required (factual, analytical, comparative, etc.)
3. **Scope Definition**: Determine breadth and depth of information gathering
4. **Success Criteria**: Define what constitutes successful information retrieval

### Phase 2: Context Assessment
```
// TEST: Should evaluate context constraints accurately
// TEST: Should identify relevant domain patterns
// TEST: Should assess resource availability
```

**Reasoning Steps:**
1. **Domain Analysis**: Understand domain-specific requirements and patterns
2. **Constraint Evaluation**: Assess time, quality, and resource constraints
3. **Tool Availability**: Map available tools to information needs
4. **Risk Assessment**: Identify potential challenges and failure modes

### Phase 3: Pattern Reference Analysis
```
// TEST: Should identify relevant orchestration patterns
// TEST: Should extract applicable design elements
// TEST: Should adapt patterns to current needs
```

**Reasoning Steps:**
1. **Pattern Discovery**: Scan existing orchestrations for relevant patterns
2. **Similarity Analysis**: Identify orchestrations addressing similar needs
3. **Pattern Extraction**: Extract reusable design elements and sequences
4. **Adaptation Planning**: Plan how to adapt patterns to current requirements

### Phase 4: Primitive Sequence Design
```
// TEST: Should design logical primitive sequences
// TEST: Should optimize for efficiency and quality
// TEST: Should include proper error handling
```

**Reasoning Steps:**
1. **Primitive Selection**: Choose appropriate primitives for each information need component
2. **Sequence Optimization**: Design optimal execution order and dependencies
3. **Integration Planning**: Plan data flow and transformation between primitives
4. **Quality Assurance**: Include validation and quality checkpoints

### Phase 5: Orchestration Validation
```
// TEST: Should validate orchestration completeness
// TEST: Should identify potential failure points
// TEST: Should provide execution confidence assessment
```

**Reasoning Steps:**
1. **Completeness Check**: Verify all information needs are addressed
2. **Feasibility Assessment**: Evaluate execution feasibility with available resources
3. **Quality Prediction**: Estimate expected output quality and confidence
4. **Refinement Opportunities**: Identify potential improvements and alternatives

---

## Integration with Existing Systems

### Primitive Integration

The tool leverages the four core primitives defined in [`specs/primitives-specification.md`](specs/primitives-specification.md:1):

1. **Querying Primitive**: For information gathering across multiple sources
2. **Filtering Primitive**: For data quality and relevance optimization
3. **Aggregation Primitive**: For synthesis and pattern identification
4. **Reasoning Primitive**: For analysis and insight generation

### Orchestration Pattern Reference

The tool reads and analyzes existing orchestrations from [`src/resources/orchestrations/`](src/resources/orchestrations/) to:

- Identify successful pattern combinations
- Extract domain-specific optimization strategies
- Learn from proven orchestration architectures
- Adapt existing patterns to new requirements

### Integration Patterns

Following patterns from [`pseudocode/05_integration_patterns.md`](pseudocode/05_integration_patterns.md:1):

- **Sequential Chaining**: Linear primitive execution
- **Parallel Execution**: Concurrent primitive processing
- **Iterative Refinement**: Feedback-driven improvement
- **Selective Processing**: Conditional primitive execution

---

## Input/Output Formats

### Input Structure

```json
{
  "information_need": "Comprehensive analysis of emerging AI startups in healthcare for investment evaluation",
  "context": {
    "domain": "business-market-intelligence",
    "complexity": "high",
    "time_constraint": "2-3 hours",
    "quality_requirements": "Investment-grade accuracy with source verification",
    "available_tools": ["web_search_exa", "company_research_exa", "linkedin_search_exa"]
  },
  "reasoning_depth": "deep",
  "reference_patterns": true,
  "agentic_level": "guided"
}
```

### Output Structure

```json
{
  "orchestration_plan": {
    "plan_id": "orch_20250121_001",
    "information_need": "Comprehensive analysis of emerging AI startups in healthcare for investment evaluation",
    "reasoning_chain": {
      "phase_1_need_analysis": {
        "components": [
          "startup_identification",
          "market_positioning",
          "technology_assessment",
          "financial_analysis",
          "competitive_landscape"
        ],
        "information_types": ["factual", "analytical", "comparative"],
        "scope": "emerging_companies_last_24_months",
        "success_criteria": "actionable_investment_insights"
      },
      "phase_2_context_assessment": {
        "domain_patterns": ["company-research", "competitive-analysis"],
        "constraints": {
          "time": "2-3 hours",
          "quality": "investment-grade",
          "tools": 3
        },
        "risks": ["data_freshness", "market_volatility", "incomplete_information"]
      },
      "phase_3_pattern_analysis": {
        "relevant_orchestrations": [
          "comprehensive-company-profile.md",
          "investment-financial-insights.md",
          "competitor-identification-profiling.md"
        ],
        "extracted_patterns": [
          "multi_source_validation",
          "financial_data_prioritization",
          "competitive_context_integration"
        ],
        "adaptations": ["healthcare_domain_focus", "emerging_company_filters"]
      },
      "phase_4_sequence_design": {
        "primitive_sequence": [
          {
            "primitive": "querying",
            "purpose": "startup_discovery",
            "strategy": {
              "target": "company_analysis",
              "sources": {
                "primary": ["company_research_exa", "web_search_exa"],
                "secondary": ["linkedin_search_exa"]
              },
              "filters": {
                "date_range": "24_months",
                "domains": ["healthcare", "ai", "startup"],
                "content_type": "news"
              }
            },
            "expected_output": "startup_candidate_list"
          },
          {
            "primitive": "filtering",
            "purpose": "quality_refinement",
            "filter_rules": [
              {
                "rule_type": "relevance_threshold",
                "field": "confidence_score",
                "operator": ">=",
                "value": 0.8
              },
              {
                "rule_type": "content_quality",
                "criteria": ["has_funding_info", "recent_activity", "credible_source"],
                "logic": "all"
              }
            ],
            "expected_output": "qualified_startup_list"
          },
          {
            "primitive": "aggregation",
            "purpose": "market_synthesis",
            "operations": [
              {
                "operation": "group_by",
                "field": "technology_focus",
                "sub_operations": ["count", "funding_analysis"]
              },
              {
                "operation": "synthesize",
                "method": "investment_analysis",
                "output_format": "investment_brief"
              }
            ],
            "expected_output": "market_analysis_report"
          },
          {
            "primitive": "reasoning",
            "purpose": "investment_evaluation",
            "reasoning_strategy": {
              "framework": "investment_analysis",
              "clear_thought_pattern": {
                "observation": "market_data_review",
                "hypothesis": "investment_opportunity_identification",
                "prediction": "growth_potential_assessment",
                "verification": "risk_factor_validation"
              },
              "reasoning_objectives": [
                "identify_investment_opportunities",
                "assess_market_dynamics",
                "evaluate_competitive_positioning"
              ]
            },
            "expected_output": "investment_recommendations"
          }
        ]
      },
      "phase_5_validation": {
        "completeness_score": 0.92,
        "feasibility_assessment": "high",
        "quality_prediction": 0.87,
        "execution_confidence": 0.89,
        "refinement_suggestions": [
          "add_patent_analysis",
          "include_regulatory_assessment"
        ]
      }
    },
    "execution_metadata": {
      "estimated_duration": "2.5 hours",
      "resource_requirements": {
        "api_calls": 45,
        "processing_complexity": "high"
      },
      "quality_indicators": {
        "confidence_threshold": 0.8,
        "validation_checkpoints": 4,
        "error_recovery_points": 3
      }
    },
    "orchestration_specification": {
      "name": "AI Healthcare Startup Investment Analysis",
      "version": "1.0.0",
      "category": "business-market-intelligence",
      "complexity": "high",
      "agentic_level": "guided",
      "primitive_chain": [
        "querying → filtering → aggregation → reasoning"
      ],
      "success_metrics": [
        "startup_coverage_completeness",
        "financial_data_accuracy",
        "investment_insight_actionability"
      ]
    }
  },
  "reasoning_metadata": {
    "reasoning_depth": "deep",
    "patterns_analyzed": 12,
    "execution_time_ms": 3200,
    "confidence_level": 0.89,
    "next_steps": [
      "execute_orchestration",
      "monitor_quality_metrics",
      "iterate_based_on_results"
    ]
  }
}
```

---

## Usage Examples

### Example 1: Business Intelligence Research

**Input:**
```json
{
  "information_need": "Analyze competitor pricing strategies for SaaS project management tools",
  "context": {
    "domain": "competitive-analysis-strategy",
    "complexity": "medium",
    "time_constraint": "1 hour",
    "quality_requirements": "Market-ready insights with pricing data"
  }
}
```

**Process:**
1. **Need Analysis**: Identifies pricing data, feature comparison, and market positioning requirements
2. **Pattern Reference**: Leverages `product-feature-pricing-comparison.md` orchestration
3. **Sequence Design**: Querying → Filtering → Aggregation → Reasoning
4. **Validation**: Ensures comprehensive competitor coverage and pricing accuracy

**Expected Output**: Orchestration plan optimized for competitive pricing analysis

### Example 2: Academic Research Synthesis

**Input:**
```json
{
  "information_need": "Literature review on machine learning applications in climate modeling",
  "context": {
    "domain": "knowledge-academic-research",
    "complexity": "high",
    "quality_requirements": "Academic rigor with peer-reviewed sources"
  }
}
```

**Process:**
1. **Need Analysis**: Identifies academic source requirements and synthesis needs
2. **Pattern Reference**: Adapts `topic-literature-review.md` orchestration
3. **Sequence Design**: Enhanced querying with academic filters → Rigorous filtering → Thematic aggregation → Academic reasoning
4. **Validation**: Ensures peer-review quality and comprehensive coverage

**Expected Output**: Orchestration plan optimized for academic literature synthesis

---

## Error Handling and Validation

### Error Classification

Following patterns from [`pseudocode/05_integration_patterns.md`](pseudocode/05_integration_patterns.md:126):

#### Critical Errors (Planning Failure)
- **Insufficient Information**: Information need too vague for orchestration design
- **Resource Constraints**: Available tools insufficient for requirements
- **Pattern Mismatch**: No suitable orchestration patterns found
- **Logical Inconsistency**: Contradictory requirements or constraints

#### Recoverable Warnings (Planning Continues)
- **Suboptimal Resources**: Limited tools available but workable
- **Pattern Adaptation**: Existing patterns require significant modification
- **Quality Trade-offs**: Time constraints may impact quality
- **Complexity Mismatch**: Complexity level may not match available resources

### Validation Framework

```
// TEST: Should validate orchestration plan completeness
// TEST: Should identify resource constraint violations
// TEST: Should assess execution feasibility
// TEST: Should provide quality confidence estimates
```

**Validation Checks:**
1. **Completeness Validation**: All information need components addressed
2. **Resource Validation**: Available tools sufficient for planned primitives
3. **Logic Validation**: Primitive sequence logically sound
4. **Quality Validation**: Expected output quality meets requirements
5. **Feasibility Validation**: Execution possible within constraints

### Recovery Mechanisms

1. **Automatic Adaptations**:
   - Simplify orchestration for resource constraints
   - Adjust quality thresholds for time constraints
   - Substitute unavailable tools with alternatives
   - Modify primitive sequences for optimization

2. **User Intervention Points**:
   - Ambiguous information needs requiring clarification
   - Critical resource limitations requiring tool expansion
   - Quality vs. speed trade-offs requiring user decision
   - Complex domain requirements needing expert input

---

## Integration Guidelines

### MCP Server Integration

```typescript
// Register the orchestration reasoning tool
import { registerOrchestrationReasoning } from './tools/orchestrationReasoning.js';

export function setupServer() {
  const server = new McpServer();
  
  // Register orchestration reasoning tool
  registerOrchestrationReasoning(server, {
    orchestrationPath: './src/resources/orchestrations',
    primitivePath: './src/primitives',
    enablePatternAnalysis: true,
    defaultAgenticLevel: 'guided'
  });
  
  return server;
}
```

### Orchestration Execution Integration

The tool output provides executable orchestration specifications that can be:

1. **Direct Execution**: Passed to orchestration execution engine
2. **Manual Review**: Reviewed and modified before execution
3. **Template Generation**: Used to create reusable orchestration templates
4. **Pattern Library**: Added to orchestration pattern library for future reference

### Quality Assurance Integration

```
// TEST: Should integrate with existing quality frameworks
// TEST: Should provide execution monitoring hooks
// TEST: Should enable iterative improvement
```

**Quality Integration Points:**
- **Pre-execution Validation**: Orchestration plan quality assessment
- **Execution Monitoring**: Real-time quality tracking during execution
- **Post-execution Analysis**: Results quality evaluation and learning
- **Continuous Improvement**: Pattern library updates based on outcomes

---

## Performance Considerations

### Reasoning Optimization

- **Pattern Caching**: Cache frequently used orchestration patterns
- **Incremental Analysis**: Build on previous reasoning for similar needs
- **Parallel Processing**: Analyze multiple pattern options concurrently
- **Depth Control**: Adjust reasoning depth based on complexity requirements

### Resource Management

- **Memory Efficiency**: Stream large orchestration pattern libraries
- **API Rate Limiting**: Respect MCP tool rate limits during analysis
- **Timeout Handling**: Graceful degradation for time-constrained planning
- **Scalability**: Support for large-scale orchestration libraries

### Quality vs. Speed Trade-offs

- **Fast Mode**: Surface-level analysis for quick orchestration design
- **Balanced Mode**: Moderate analysis balancing speed and quality
- **Deep Mode**: Comprehensive analysis for critical applications
- **Adaptive Mode**: Automatically adjust depth based on context

---

## Security and Privacy

### Data Handling

- **Information Need Privacy**: Sensitive information needs handled securely
- **Pattern Confidentiality**: Proprietary orchestration patterns protected
- **Execution Isolation**: Orchestration planning isolated from execution
- **Audit Trails**: Complete reasoning chain logging for accountability

### Access Control

- **Pattern Access**: Role-based access to orchestration pattern libraries
- **Tool Permissions**: Respect MCP tool access permissions
- **Context Sensitivity**: Handle sensitive domain contexts appropriately
- **Output Sanitization**: Remove sensitive information from orchestration plans

---

## Future Enhancements

### Advanced Reasoning Capabilities

1. **Multi-Agent Orchestration**: Coordinate multiple AI agents in orchestrations
2. **Dynamic Adaptation**: Real-time orchestration modification during execution
3. **Learning Integration**: Learn from orchestration outcomes to improve planning
4. **Domain Specialization**: Specialized reasoning for specific domains

### Integration Expansions

1. **External Pattern Libraries**: Integration with external orchestration repositories
2. **Collaborative Planning**: Multi-user orchestration design collaboration
3. **Version Control**: Orchestration plan versioning and change management
4. **Execution Platforms**: Integration with multiple orchestration execution platforms

### Quality Improvements

1. **Predictive Quality**: Machine learning-based quality prediction
2. **Automated Testing**: Automated orchestration plan testing and validation
3. **Performance Optimization**: Automated orchestration performance optimization
4. **Continuous Learning**: Continuous improvement based on execution feedback

---

## Conclusion

The `orchestration_reasoning` MCP tool provides a powerful framework for dynamic orchestration design, combining structured reasoning with primitive composability. By leveraging existing patterns and providing systematic analysis, it enables models to create optimized orchestrations tailored to specific information needs and constraints.

The tool's integration with the existing primitive architecture and orchestration library creates a comprehensive system for intelligent information retrieval orchestration, supporting everything from simple queries to complex multi-stage analytical workflows.

<!--TASK_AGENT_CONTEXT
role: Specification-Writer
motivation: Create comprehensive tool specification enabling dynamic orchestration design
constraints: Maintain compatibility with existing primitives and orchestration patterns
output_format: Complete MCP tool specification with examples, validation, and integration guidelines
-->