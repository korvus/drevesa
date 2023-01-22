import { useSprings, animated } from 'react-spring';
import { memo } from 'react';

function calculateTime(speed, distance) {
    return Math.round((distance / speed) * 1000);
}

function randomNumber(minimum = 5, maximum = 15) {
    return Math.floor(Math.random() * (maximum - minimum + 1) + minimum);
}

const Cloud = memo(({ widthContainer, heightContainer }) => {

    const nbrIterations = randomNumber();

    const randomArrayStart = Array(nbrIterations).fill().map(() => (randomNumber(200, widthContainer)) * -1);
    const randomArraySpeed = Array(nbrIterations).fill().map((_, i) => {
        const distanceForCloud = (Math.abs(randomArrayStart[i])) + widthContainer;
        return calculateTime(randomNumber(50, 150), distanceForCloud);
    })

    const [springs] = useSprings(
        nbrIterations,
        i => ({
            loop: true,
            from: { left: randomArrayStart[i] },
            to: { left: widthContainer },
            config: {
                duration: randomArraySpeed[i]
            },
        }),
    );

    const randomTop = () => randomNumber(0, heightContainer);

    return <div className="wrapperAnims">
        {springs.map((props, i) => (
            <animated.div style={{ ...props, top: randomTop(i) + "px" }} className="cloud" key={i} />
        ))}
    </div>
});

export default Cloud;