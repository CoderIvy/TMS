<?php
// only included by api.php
if (defined("_API_ENTRY") === false) {
    exit(0);
}

// enable database access
include_once CFGDIR . 'database.php';

class Database
{

    private $host = "127.0.0.1";
    private $port = 3306;
    private $dbname = "dbname";
    private $username = "dbUsername";
    private $password = "dbPassword";

    private $conn;

    private $stmt = null;

    private $connected = false;

    public function __construct()
    {
        global $DatabaseAccount;
        // $DatabaseAccount["host"] = "127.0.0.1";
        // $DatabaseAccount["port"] = 3306;
        // $DatabaseAccount["dbname"] = "dbname";
        // $DatabaseAccount["username"] = "username";
        // $DatabaseAccount["password"] = "password";

        // merge
        if ($DatabaseAccount["host"] != null){
            $this->host = $DatabaseAccount["host"];
        }
        if ($DatabaseAccount["port"] != null){
            $this->port = $DatabaseAccount["port"];
        }
        if ($DatabaseAccount["dbname"] != null){
            $this->dbname = $DatabaseAccount["dbname"];
        }
        if ($DatabaseAccount["username"] != null){
            $this->username = $DatabaseAccount["username"];
        }
        if ($DatabaseAccount["password"] != null){
            $this->password = $DatabaseAccount["password"];
        }
    }

    public function close()
    {
        if ($this->connected) {
            $this->connected = false;
            $this->conn->close();
        }
    }

    public function query(string $sql)
    {
        $types = "";
        $var1 = "";
        return $this->execute($sql, $types, $var1);
    }

    public function execute(string $sql, string $types, &$var1, &...$vars)
    {
        global $output;
        $this->close();
        $this->getConnection();

        $this->stmt = $this->conn->prepare($sql);
        if ($this->conn->errno != 0) {
            $output["errcode"] = 1002;
            $output["errmsg"] = "database prepare failed: " . 'Error (' . $this->conn->errno . ') ' . $this->conn->error;
            $output["data"] = new stdClass();
            $this->close();
            done();
        }
        if (strlen($types) > 0) {
            $this->stmt->bind_param($types, $var1, ...$vars);
            if ($this->conn->errno != 0) {
                $output["errcode"] = 1002;
                $output["errmsg"] = "database bind_param failed: " . 'Error (' . $this->conn->errno . ') ' . $this->conn->error;
                $output["data"] = new stdClass();
                $this->close();
                done();
            }
        }
        // set parameters and execute
        $this->stmt->execute();

        if ($this->stmt->error != null) {
            $output["errcode"] = 1002;
            $output["errmsg"] = "database execute failed: " . 'Error (' . $this->stmt->errno . ') ' . $this->stmt->error;
            $output["data"] = new stdClass();
            $this->close();
            done();
        }
        return $this->stmt;
    }

    // get the database connection
    public function getConnection()
    {
        global $output;
        if ($this->connected == false) {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->dbname, $this->port);
            if ($this->conn->connect_error) {
                $this->connected = false;
                $output["errcode"] = 127;
                $output["errmsg"] = "database initialize failed: " . 'Connect Error (' . $this->conn->connect_errno . ') ' . $this->conn->connect_error;
                $output["data"] = new stdClass();
                done();
            }
            $this->connected = true;
        }
        return $this->conn;
    }
}

// instantiate database and product object
$database = new Database();
