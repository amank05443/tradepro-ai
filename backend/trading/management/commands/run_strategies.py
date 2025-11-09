"""
Management command to run trading strategies
Can be run as a background process or cron job
"""
from django.core.management.base import BaseCommand
from trading.strategy_executor import strategy_executor
import time
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run trading strategies in the background'

    def add_arguments(self, parser):
        parser.add_argument(
            '--once',
            action='store_true',
            help='Run once and exit (useful for cron jobs)',
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='Check interval in seconds (default: 60)',
        )

    def handle(self, *args, **options):
        run_once = options['once']
        interval = options['interval']

        self.stdout.write(
            self.style.SUCCESS(f'Starting strategy executor (run_once={run_once}, interval={interval}s)')
        )

        if run_once:
            # Run once and exit
            count = strategy_executor.execute_pending_strategies()
            self.stdout.write(
                self.style.SUCCESS(f'Executed {count} strategies')
            )
        else:
            # Run continuously
            self.stdout.write(
                self.style.WARNING('Running in continuous mode. Press Ctrl+C to stop.')
            )
            try:
                while True:
                    count = strategy_executor.execute_pending_strategies()
                    if count > 0:
                        self.stdout.write(
                            self.style.SUCCESS(f'Executed {count} strategies')
                        )
                    time.sleep(interval)
            except KeyboardInterrupt:
                self.stdout.write(
                    self.style.WARNING('\nStopping strategy executor...')
                )
