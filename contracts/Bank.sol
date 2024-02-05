// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Desarrollo de un contrato inteligente simple para un banco descentralizado.
/// @author Aldo Munaretto.
/// @notice Este contrato permite depositar, retirar, calcular intereses, así como la gestión de la tasa de interes y los admins.
/// @dev Este contrato implementa operaciones bancarias básicas con una tasa de interés fija.
contract Bank {
    /// @notice La dirección del propietario del contrato.
    address owner;
    /// @notice La tasa de interés anual fija.
    uint256 private annualInterestRate = 5; // 5% interest

    /// @notice Estructura para almacenar los intereses de un usuario y el timestamp de la ultima vez que fuero pagados.
    struct Interest {
        uint256 interestGiven;
        uint256 lastInterestTime;
    }

    /// @notice Mapeo de saldos de usuarios.
    mapping(address => uint256) private balances;
    /// @notice Mapeo de intereses de usuarios.
    mapping(address => Interest) private interests;
    /// @notice Mapeo de admins.
    mapping(address => bool) public admins;

    /// @notice Constructor que inicializa el contrato y establece al creador del contrato como admin.
    /// @dev El constructor establece al creador del contrato como dueño y administrador.
    constructor() {
        owner = tx.origin;
        admins[tx.origin] = true;
    }

    /// @notice Evento que se emite cuando un usuario deposita fondos.
    /// @param depositor Dirección del usuario depositante.
    /// @param amount Cantidad depositada.
    event Deposited(address indexed depositor, uint256 amount);
    /// @notice Evento que se emite cuando un usuario retira fondos.
    /// @param withdrawal Dirección del usuario que retira.
    /// @param amount Cantidad retirada.
    event Withdrawn(address indexed withdrawal, uint256 amount);
    /// @notice Evento que se emite cuando se paga un interés a un usuario.
    /// @param user Dirección del usuario al que se le paga el interés.
    /// @param amount Cantidad de interés pagada.
    event InterestPaid(address indexed user, uint256 amount);

    /// @notice Modificador que restringe el acceso solo a los admins.
    modifier onlyAdmin {
        require(admins[msg.sender], "UNAUTHORIZED");
        _;
    }

    /// @notice Función para agregar un admin.
    /// @dev Solo los admins pueden agregar otros admins.
    /// @param user Dirección del usuario que se agregará como admin.
    function addAdmin(address user) public onlyAdmin {
        admins[user] = true;
    }

    /// @notice Función para eliminar un admin.
    /// @dev Solo los admins pueden eliminar otros admins. No pueden eliminarse ellos mismos ni al dueño del contrato.
    /// @param user Dirección del usuario que se eliminará como admin.
    function removeAdmin(address user) public onlyAdmin {
        require(msg.sender != user, "CANNOT_REMOVE_SELF");
        require(owner != user, "CANNOT_REMOVE_OWNER");
        admins[user] = false;
    }

    /// @notice Función para que un usuario obtenga su saldo.
    /// @dev Calcula el balance actual más los intereses no pagados
    /// @return Saldo del usuario.
    function getMyBalance() public view returns (uint256) {
        uint256 interest = estimateInterest(msg.sender);
        return balances[msg.sender] + interest;
    }

    /// @notice Función para que un admin obtenga el saldo de un usuario.
    /// @dev Calcula solo el balance actual y no contempla los intereses estimados y no pagados
    /// @param user Dirección del usuario del que se obtendrá el saldo.
    /// @return Saldo del usuario.
    function getUserBalance(address user) public view onlyAdmin returns (uint256) {
        return balances[user];
    }

    /// @notice Función para que un usuario deposite fondos en el contrato.
    /// @dev Si tiene saldo previo, calcula los intereses no pagados y los agrega al balance.
    /// @dev El valor enviado debe ser mayor a cero. Emite el evento Deposited.
    function deposit() public payable {
        require(msg.value > 0, "MIN_ETHER_NOT_MET");
        if(interests[msg.sender].lastInterestTime == 0) {
            interests[msg.sender].lastInterestTime = block.timestamp;
        } else {
            calculateInterest(msg.sender);
        }
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Función para que un usuario retire fondos del contrato.
    /// @dev Calcula los intereses no pagados y los agrega al balance antes del retiro de fondos.
    /// @dev El valor a retirar debe ser menor o igual al balance del usuario. Emite el evento Withdrawn.
    function withdraw(uint256 amount) public {
        calculateInterest(msg.sender);
        require(balances[msg.sender] >= amount, "INSUFFICIENT_BALANCE");
        payable(msg.sender).transfer(amount);
        balances[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Función que calcula y aplica los intereses al balance de un usuario.
    /// @dev Función interna que calcula los intereses no pagados y los agrega al balance. Emite el evento InterestPaid.
    /// @param user Dirección del usuario al que se le calcularán los intereses.
    function calculateInterest(address user) internal {
        uint256 interest = estimateInterest(user);
        balances[user] += interest;
        interests[user].interestGiven += interest;
        interests[user].lastInterestTime = block.timestamp;
        emit InterestPaid(user, interest);
    }

    /// @notice Función que estima los intereses no pagados de un usuario.
    /// @dev Función interna que estima los intereses no pagados de un usuario.
    /// @param user Dirección del usuario al que se le estimarán los intereses.
    /// @return Intereses estimados.
    function estimateInterest(address user) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - interests[user].lastInterestTime;
        uint256 interest = balances[user] * annualInterestRate / 100 * timeElapsed / 365 days;
        return interest;
    }

    /// @notice Función para que un usuario obtenga sus intereses pagados más los estimados.
    /// @dev Calcula los intereses no pagados sin añadirlos al saldo.
    /// @return Intereses ya añadidos al saldo más los estimados desde la fecha del ultimo pago.
    function getMyInterest() public view returns (uint256) {
        uint256 interest = estimateInterest(msg.sender);
        return interests[msg.sender].interestGiven + interest;
    }

    /// @notice Función para que un admin obtenga los intereses pagados de un usuario.
    /// @dev Calcula los intereses pagados y añadidos al saldo.
    /// @param user Dirección del usuario del que se obtendrán los intereses.
    /// @return Intereses ya añadidos al saldo.
    function getUserInterest(address user) public view onlyAdmin returns (uint256) {
        return interests[user].interestGiven;
    }

    /// @notice Función para que un admin obtenga la fecha del ultimo pago de intereses de un usuario.
    /// @param user Dirección del usuario del que se obtendrá la fecha del ultimo pago de intereses.
    /// @return Fecha del ultimo pago de intereses.
    function getUserLastInterestPaid(address user) public view onlyAdmin returns (uint256) {
        return interests[user].lastInterestTime;
    }

    /// @notice Función publica para obtener la tasa de interes fijo anual.
    /// @return Tasa de interes anual.
    function getannualInterestRate() public view returns (uint256) {
        return annualInterestRate;
    }

    /// @notice Función para que un admin establezca una nueva tasa de interes fijo anual.
    /// @dev Solo los admins pueden establecer la tasa de interes. La tasa debe ser mayor o igual a cero.
    /// @param rate Nueva tasa de interes anual.
    function setannualInterestRate(uint256 rate) public onlyAdmin {
        require(rate > 0, "INVALID_RATE");
        annualInterestRate = rate;
    }

}
