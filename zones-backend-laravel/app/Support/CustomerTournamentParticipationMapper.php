<?php

namespace App\Support;

use App\Models\Tournament;
use App\Models\TournamentMatch;
use App\Models\TournamentParticipant;

class CustomerTournamentParticipationMapper
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(TournamentParticipant $participant): array
    {
        $tournament = $participant->tournament;
        if (! $tournament) {
            return [];
        }

        $tournament->loadMissing([
            'station',
            'matches.player1',
            'matches.player2',
            'participants',
        ]);

        $registeredCount = $tournament->registeredParticipantsCount();
        $maxParticipants = (int) $tournament->max_participants;

        return [
            'id' => (string) $participant->id,
            'tournament_id' => (string) $tournament->id,
            'tournament_title' => $tournament->title,
            'game_name' => $tournament->game_name,
            'game_emoji' => $tournament->game_emoji ?? '🎮',
            'lounge_id' => (string) $tournament->station_id,
            'lounge_name' => $tournament->station?->name ?? '',
            'cover_image_url' => MediaUrl::resolve($tournament->cover_image),
            'status' => $participant->status,
            'status_label' => $participant->status === 'withdrawn' ? 'منسحب' : 'مسجل',
            'tournament_status' => $tournament->status,
            'tournament_status_label' => self::tournamentStatusLabel($tournament->status),
            'start_date' => $tournament->start_date?->toIso8601String(),
            'end_date' => $tournament->end_date?->toIso8601String(),
            'registration_deadline' => $tournament->registration_deadline?->toIso8601String(),
            'is_registration_open' => $tournament->isRegistrationOpen(),
            'can_withdraw' => $participant->status === 'registered'
                && $tournament->isRegistrationOpen(),
            'participants_count' => $registeredCount,
            'max_participants' => $maxParticipants,
            'is_full' => $registeredCount >= $maxParticipants,
            'result_summary' => self::resultSummary($tournament, $participant),
            'completion_status' => self::completionStatus($tournament),
            'registered_at' => ($participant->registered_at ?? $participant->created_at)?->toIso8601String(),
        ];
    }

    public static function tournamentStatusLabel(string $status): string
    {
        return match ($status) {
            'ongoing' => 'جارية',
            'completed' => 'منتهية',
            'cancelled' => 'ملغاة',
            default => 'قادمة',
        };
    }

    public static function completionStatus(Tournament $tournament): string
    {
        return match ($tournament->status) {
            'completed' => 'مكتملة',
            'ongoing' => 'جارية الآن',
            'cancelled' => 'ملغاة',
            default => 'لم تبدأ بعد',
        };
    }

    public static function resultSummary(
        Tournament $tournament,
        TournamentParticipant $participant,
    ): string {
        if ($tournament->status !== 'completed') {
            return '—';
        }

        $final = $tournament->matches
            ->where('round', 'final')
            ->where('status', 'completed')
            ->first();

        if ($final instanceof TournamentMatch && $final->winner_id) {
            $winner = $tournament->participants->firstWhere('id', $final->winner_id);
            if ($winner) {
                if ((int) $winner->id === (int) $participant->id) {
                    return 'البطل — '.$winner->name;
                }

                return 'البطل: '.$winner->name;
            }
        }

        $lastMatch = $tournament->matches
            ->filter(
                fn (TournamentMatch $m) => (int) $m->player1_id === (int) $participant->id
                    || (int) $m->player2_id === (int) $participant->id
            )
            ->sortByDesc('scheduled_at')
            ->first();

        if ($lastMatch instanceof TournamentMatch) {
            if ((int) $lastMatch->winner_id === (int) $participant->id) {
                return 'فوز في '.self::roundLabel($lastMatch->round);
            }

            if ($lastMatch->status === 'completed') {
                return 'خروج من '.self::roundLabel($lastMatch->round);
            }
        }

        return 'شاركت في البطولة';
    }

    private static function roundLabel(string $round): string
    {
        return match ($round) {
            'semi_final' => 'نصف النهائي',
            'final' => 'النهائي',
            default => 'ربع النهائي',
        };
    }
}
