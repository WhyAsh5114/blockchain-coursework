# Module 2 - Create a Cryptocurrency (Hadcoin), node on port 5002  (Lab 3)
# Change asked in the task sheet: transactions are removed from the pending list once they are added to a block.
import datetime
import hashlib
import json
from uuid import uuid4
from urllib.parse import urlparse
import requests
from flask import Flask, jsonify, request


class Blockchain:
    def __init__(self):
        self.chain = []
        self.transactions = []
        self.nodes = set()
        self.create_block(proof=1, previous_hash='0')

    def create_block(self, proof, previous_hash):
        block = {'index': len(self.chain) + 1,
                 'timestamp': str(datetime.datetime.now()),
                 'proof': proof,
                 'previous_hash': previous_hash,
                 'transactions': self.transactions}
        self.transactions = []          # removed from the pending list once they are in a block
        self.chain.append(block)
        return block

    def get_previous_block(self):
        return self.chain[-1]

    def proof_of_work(self, previous_proof):
        new_proof = 1
        check_proof = False
        while check_proof is False:
            hash_operation = hashlib.sha256(str(new_proof**2 - previous_proof**2).encode()).hexdigest()
            if hash_operation[:4] == '0000':
                check_proof = True
            else:
                new_proof += 1
        return new_proof

    def hash(self, block):
        return hashlib.sha256(json.dumps(block, sort_keys=True).encode()).hexdigest()

    def is_chain_valid(self, chain):
        previous_block = chain[0]
        block_index = 1
        while block_index < len(chain):
            block = chain[block_index]
            if block['previous_hash'] != self.hash(previous_block):
                return False
            hash_operation = hashlib.sha256(
                str(block['proof']**2 - previous_block['proof']**2).encode()).hexdigest()
            if hash_operation[:4] != '0000':
                return False
            previous_block = block
            block_index += 1
        return True

    def add_transaction(self, sender, receiver, amount):
        self.transactions.append({'sender': sender, 'receiver': receiver, 'amount': amount})
        return self.get_previous_block()['index'] + 1

    def add_node(self, address):
        self.nodes.add(urlparse(address).netloc)

    def replace_chain(self):
        longest_chain = None
        max_length = len(self.chain)
        for node in self.nodes:
            response = requests.get(f'http://{node}/get_chain')
            if response.status_code == 200:
                length = response.json()['length']
                chain = response.json()['chain']
                if length > max_length and self.is_chain_valid(chain):
                    max_length = length
                    longest_chain = chain
        if longest_chain:
            self.chain = longest_chain
            return True
        return False


app = Flask(__name__)
node_address = str(uuid4()).replace('-', '')     # address of this node, used for its mining reward
blockchain = Blockchain()


@app.after_request
def allow_browser_clients(response):       # lets a browser-based API client call this server
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response


@app.route('/mine_block', methods=['GET'])
def mine_block():
    previous_block = blockchain.get_previous_block()
    proof = blockchain.proof_of_work(previous_block['proof'])
    blockchain.add_transaction(sender=node_address, receiver='node_5002', amount=1)    # mining reward
    block = blockchain.create_block(proof, blockchain.hash(previous_block))
    return jsonify({'message': 'Congratulations, you just mined a block!', **block}), 200


@app.route('/get_chain', methods=['GET'])
def get_chain():
    return jsonify({'chain': blockchain.chain, 'length': len(blockchain.chain)}), 200


@app.route('/is_valid', methods=['GET'])
def is_valid():
    ok = blockchain.is_chain_valid(blockchain.chain)
    return jsonify({'message': 'All good. The Blockchain is valid.' if ok else 'The Blockchain is not valid.'}), 200


@app.route('/add_transaction', methods=['POST'])
def add_transaction():
    data = request.get_json()
    if not all(k in data for k in ('sender', 'receiver', 'amount')):
        return 'Some elements of the transaction are missing', 400
    index = blockchain.add_transaction(data['sender'], data['receiver'], data['amount'])
    return jsonify({'message': f'This transaction will be added to Block {index}'}), 201


@app.route('/connect_node', methods=['POST'])
def connect_node():
    nodes = request.get_json().get('nodes')
    if nodes is None:
        return 'No node', 400
    for node in nodes:
        blockchain.add_node(node)
    return jsonify({'message': 'All the nodes are now connected.',
                    'total_nodes': list(blockchain.nodes)}), 201


@app.route('/replace_chain', methods=['GET'])
def replace_chain():
    if blockchain.replace_chain():
        return jsonify({'message': 'The nodes had different chains, so the chain was replaced by the longest one.',
                        'new_chain': blockchain.chain}), 200
    return jsonify({'message': 'All good. The chain is the largest one.', 'actual_chain': blockchain.chain}), 200


app.run(host='127.0.0.1', port=5002)
