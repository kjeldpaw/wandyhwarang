<?php

namespace App\Models;

use App\BaseModel;

class User extends BaseModel
{
    protected $table = 'users';

    public function __construct()
    {
        parent::__construct();
    }
}