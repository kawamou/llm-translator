export const Progress = ({
	text,
	percentage,
}: { text: string; percentage: number }) => {
	percentage = percentage ?? 0;
	return (
		<div>
			<div style={{ width: `${percentage}%` }}>
				{text} ({`${percentage.toFixed(2)}%`})
			</div>
		</div>
	);
};
