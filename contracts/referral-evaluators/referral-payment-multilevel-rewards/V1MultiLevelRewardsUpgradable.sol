//
//import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
//import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
//
//contract V1MultiLevelRewardsUpgradable is Initializable, UUPSUpgradeable {
//    struct PaymentQuantities {
//        uint amount;
//        uint quantity;
//    }
//
//    struct Node {
//        uint id;
//        address nodeAddress;
//        PaymentQuantities payment;
//        uint parentId;
//        uint[] childrenIds;
//    }
//
//    mapping(address => bool) public addressExists;
//    mapping(uint => Node) public nodes;
//    uint public nodesCount;
//
//    function initialize() public initializer {
//        // initialize the root node
//        nodesCount = 1;
//        nodes[1] = Node(
//            1,
//            address(0),
//            PaymentQuantities(0, 0),
//            0,
//            new uint[](0)
//        );
//    }
//
//    function createNode(
//        address _nodeAddress,
//        PaymentQuantities memory _payment,
//        uint _parentId
//    ) public returns (uint) {
//        require(
//            !addressExists[_nodeAddress],
//            "Address already exists in the tree"
//        );
//
//        // create a new node with a unique id
//        nodesCount++;
//        nodes[nodesCount] = Node(
//            nodesCount,
//            _nodeAddress,
//            _payment,
//            _parentId,
//            new uint[](0)
//        );
//
//        // add the new node as a child of the parent node
//        nodes[_parentId].childrenIds.push(nodesCount);
//
//        // mark the address as used
//        addressExists[_nodeAddress] = true;
//
//        return nodesCount;
//    }
//}
