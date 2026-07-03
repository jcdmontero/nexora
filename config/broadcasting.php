<?php

return [

    'default' => env('BROADCAST_CONNECTION', 'pusher'),

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'host' => env('PUSHER_HOST', '127.0.0.1'),
                'port' => env('PUSHER_PORT', 6001),
                'scheme' => env('PUSHER_SCHEME', 'http'),
                'use_tls' => env('PUSHER_SCHEME', 'http') === 'https',
            ],
            'client_options' => [
                'curl_options' => [
                    CURLOPT_SSL_VERIFYPEER => true,
                ],
            ],
        ],

        'log' => [
            'driver' => 'log',
        ],

    ],

    'channels' => [
        'presence-*' => [
            'driver' => 'auth',
        ],
        'private-*' => [
            'driver' => 'auth',
        ],
    ],

];
