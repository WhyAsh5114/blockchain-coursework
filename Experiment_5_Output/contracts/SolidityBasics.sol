// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SolidityBasics
/// @notice A single teaching contract that walks through the core Solidity
///         constructs covered by Remix IDE's "Solidity Basics" LearnETH
///         course: state variables & data types, function visibility,
///         view/pure functions, control structures, structs, mappings,
///         arrays, events, modifiers, and error handling.
contract SolidityBasics {
    // ------------------------------------------------------------------
    // 1. State variables & basic data types
    // ------------------------------------------------------------------
    uint256 public unsignedNumber;      // unsigned integer
    int256 public signedNumber;         // signed integer
    bool public flag;                   // boolean
    address public owner;               // address
    string public greeting;             // dynamically-sized string
    bytes32 public fixedBytes;          // fixed-size byte array

    // ------------------------------------------------------------------
    // 2. Structs
    // ------------------------------------------------------------------
    struct Student {
        string name;
        uint256 age;
        uint256 marks;
    }

    // ------------------------------------------------------------------
    // 3. Arrays and mappings
    // ------------------------------------------------------------------
    Student[] public students;
    mapping(address => uint256) public balances;
    mapping(uint256 => Student) public studentById;
    uint256 public nextStudentId;

    // ------------------------------------------------------------------
    // 4. Events
    // ------------------------------------------------------------------
    event GreetingChanged(string oldGreeting, string newGreeting);
    event StudentAdded(uint256 indexed id, string name, uint256 marks);
    event Deposited(address indexed who, uint256 amount);

    // ------------------------------------------------------------------
    // 5. Modifiers
    // ------------------------------------------------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(string memory _greeting) {
        owner = msg.sender;
        greeting = _greeting;
        fixedBytes = "SOLIDITY";
    }

    // ------------------------------------------------------------------
    // 6. Public / external functions that mutate state
    // ------------------------------------------------------------------
    function setNumbers(uint256 _unsigned, int256 _signed) external {
        unsignedNumber = _unsigned;
        signedNumber = _signed;
    }

    function toggleFlag() external {
        flag = !flag;
    }

    function setGreeting(string calldata _newGreeting) external onlyOwner {
        string memory old = greeting;
        greeting = _newGreeting;
        emit GreetingChanged(old, _newGreeting);
    }

    function deposit() external payable {
        require(msg.value > 0, "Must send some ETH");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function addStudent(string calldata _name, uint256 _age, uint256 _marks) external {
        Student memory s = Student({name: _name, age: _age, marks: _marks});
        students.push(s);
        studentById[nextStudentId] = s;
        emit StudentAdded(nextStudentId, _name, _marks);
        nextStudentId++;
    }

    // ------------------------------------------------------------------
    // 7. Control structures: if/else, for loop, ternary
    // ------------------------------------------------------------------
    function classify(uint256 marks) public pure returns (string memory) {
        if (marks >= 75) {
            return "Distinction";
        } else if (marks >= 60) {
            return "First Class";
        } else if (marks >= 40) {
            return "Pass";
        } else {
            return "Fail";
        }
    }

    function averageMarks() public view returns (uint256) {
        uint256 total = 0;
        uint256 count = students.length;
        if (count == 0) return 0;

        for (uint256 i = 0; i < count; i++) {
            total += students[i].marks;
        }
        return total / count;
    }

    function isEven(uint256 n) public pure returns (bool) {
        return n % 2 == 0 ? true : false;
    }

    // ------------------------------------------------------------------
    // 8. View / pure functions
    // ------------------------------------------------------------------
    function getStudentCount() external view returns (uint256) {
        return students.length;
    }

    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }

    // ------------------------------------------------------------------
    // 9. Function visibility demo: private + internal helpers exposed
    //    through a public wrapper
    // ------------------------------------------------------------------
    uint256 private secretCounter;

    function _incrementInternal() internal returns (uint256) {
        secretCounter++;
        return secretCounter;
    }

    function bumpCounter() external returns (uint256) {
        return _incrementInternal();
    }
}
