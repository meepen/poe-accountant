export interface CostItem {
  cost: number;
}

export class MinHeap<T extends CostItem> {
  private heap: T[] = [];

  push(node: T) {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].cost >= this.heap[parentIndex].cost) {
        break;
      }
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  private sinkDown(index: number) {
    const length = this.heap.length;
    const element = this.heap[index];
    for (;;) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let leftChild: T | undefined;
      let rightChild: T | undefined;
      let swap: number | null = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.cost < element.cost) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && rightChild.cost < element.cost) ||
          (swap !== null && leftChild && rightChild.cost < leftChild.cost)
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) {
        break;
      }
      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }
}
