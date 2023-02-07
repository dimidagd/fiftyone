import { getFetchFunction } from "@fiftyone/utilities";
import { atom, useRecoilState } from "recoil";
import { useState } from "react";

class ExecutionContext {
  constructor(public params: Map<string, any> = new Map()) {}
}

class OperatorResult {
  constructor(public result: any) {}
  toJSON() {
    return this.result;
  }
}

class OperatorDefinition {
  constructor(description: string) {
    this.inputs = [];
    this.outputs = [];
  }
  public inputs: OperatorProperty[];
  public outputs: OperatorProperty[];
  public trigger: OperatorTrigger;
  addInputProperty(property: OperatorProperty) {
    this.inputs.push(property);
  }
  addOutputProperty(property: OperatorProperty) {
    this.outputs.push(property);
  }
  setTrigger(trigger: OperatorTrigger) {
    this.trigger = trigger;
  }
  static fromJSON(json: any) {
    const def = new OperatorDefinition(json.description);
    def.inputs = json.inputs.map((p: any) => OperatorProperty.fromJSON(p));
    def.outputs = json.outputs.map((p: any) => OperatorProperty.fromJSON(p));
    def.trigger = OperatorTrigger.fromJSON(json.trigger);
    return def;
  }
}
class OperatorProperty {
  public description: string;
  public required: boolean;
  public default: any;
  constructor(public name: string, public type: string) {}
  static fromJSON(json: any) {
    const property = new OperatorProperty(json.name, json.type);
    property.description = json.description;
    property.required = json.required;
    property.default = json.default;
    return property;
  }
}
class OperatorTrigger {
  static fromJSON(json: any) {
    const trigger = new OperatorTrigger();
    return trigger;
  }
}

export class Operator {
  public definition: OperatorDefinition;
  constructor(public name: string, description: string) {
    this.name = name;
    this.definition = new OperatorDefinition(description);
  }
  async execute(ctx: ExecutionContext) {
    throw new Error(`Operator ${this.name} does not implement execute`);
  }
  static fromJSON(json: any) {
    const operator = new Operator(json.name, json.description);
    operator.definition = OperatorDefinition.fromJSON(json.definition);
    return operator;
  }
}

class OperatorRegistry {
  private operators: Map<string, Operator> = new Map();
  register(operator: Operator) {
    this.operators.set(operator.name, operator);
  }
  getOperator(name: string) {
    return this.operators.get(name);
  }
  operatorExists(name: string) {
    return this.operators.has(name);
  }
}

const localRegistry = new OperatorRegistry();
const remoteRegistry = new OperatorRegistry();

export function registerOperator(operator: Operator) {
  localRegistry.register(operator);
}

export async function loadOperatorsFromServer() {
  const { operators } = await getFetchFunction()("GET", "/operators");
  const operatorInstances = operators.map((d: any) => Operator.fromJSON(d));
  for (const operator of operatorInstances) {
    remoteRegistry.register(operator);
  }
}

export function useLocalOperators() {}

export function useRemoteOperators() {}

export function useOperators() {}

export function useOperatorExecutor(name) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  return {
    isExecuting,
    error,
    result,
    async execute(params) {
      setIsExecuting(true);
      try {
        const result = await executeOperator(name, params);
        setResult(result);
      } catch (e) {
        setError(e);
      }
      setIsExecuting(false);
    },
  };
}

async function executeOperator(operatorName, params) {
  let operator;
  let isRemote = false;

  console.log(remoteRegistry);

  if (localRegistry.operatorExists(operatorName)) {
    operator = localRegistry.getOperator(operatorName);
  } else if (remoteRegistry.operatorExists(operatorName)) {
    operator = remoteRegistry.getOperator(operatorName);
    isRemote = true;
  } else {
    throw new Error(`Operator "${operatorName}" not found`);
  }
  const ctx = new ExecutionContext(params);
  let rawResult;
  if (isRemote) {
    rawResult = await getFetchFunction()("POST", "/operators/execute", {
      operator_name: operatorName,
      params: params,
    });
  } else {
    rawResult = await operator.execute(ctx);
  }
  return new OperatorResult(rawResult);
}