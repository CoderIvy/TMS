<?php
/**
 * Created by PhpStorm.
 * User: chenlan
 * Date: 14/10/18
 * Time: 4:29 PM
 */

class Database
{

    // specify your own database credentials
    private $host = "example.com";
    private $dbname = "username";
    private $username = "username";
    private $password = 'password';

    private $conn;

    private $stmt = null;

    private $connected = false;

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
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->dbname);
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
