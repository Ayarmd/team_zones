<?php

namespace App\Console\Commands;

use App\Services\CustomerBanService;
use Illuminate\Console\Command;

class ProcessNoShowBookingsCommand extends Command
{
    protected $signature = 'bookings:process-no-shows';

    protected $description = 'Mark overdue unchecked-in bookings as no-show and apply customer ban rules';

    public function handle(CustomerBanService $banService): int
    {
        $expired = $banService->expireStaleBans();
        $result = $banService->processEligibleNoShows();

        $this->info(sprintf(
            'No-show run complete: %d booking(s) processed, %d ban(s) created, %d ban(s) expired.',
            $result['processed'],
            $result['banned'],
            $expired,
        ));

        return self::SUCCESS;
    }
}
