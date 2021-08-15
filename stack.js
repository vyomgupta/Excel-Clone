class Stack{
	constructor(){
		this.arr = [];
	}

	 size(){
		return this.arr.length;
	}

	isEmpty(){
		return this.size() == 0;
	}

	push(x){
		this.arr.push(x);
	}

	peek(){
		return this.arr[this.size() - 1];
	}

	pop(){
		let val = this.arr[this.size() - 1];
		this.arr.pop();
		return val;
	}

	print(){
		console.log(this.arr);
	}
}